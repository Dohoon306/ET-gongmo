package com.gdgoc.et.profile;

import com.gdgoc.et.common.error.ApiException;
import com.gdgoc.et.common.web.CurrentUser;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Duration;
import java.util.Base64;
import javax.imageio.ImageIO;
import javax.imageio.ImageReadParam;
import javax.imageio.ImageReader;
import javax.imageio.stream.MemoryCacheImageInputStream;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.DigestUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ProfileImageController {
    private static final int MAX_BYTES = 2 * 1024 * 1024;
    private static final int MAX_BASE64_LENGTH = ((MAX_BYTES + 2) / 3) * 4;
    private static final int MAX_INPUT_SIDE = 4096;
    private static final int MAX_IMAGE_SIDE = 512;

    private final JdbcTemplate jdbc;

    public ProfileImageController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/api/users/{userId}/profile-image")
    public ResponseEntity<byte[]> findImage(@PathVariable long userId) {
        var images = jdbc.query("SELECT image_png FROM user_profile_image WHERE user_id = ?",
                (rs, rowNum) -> rs.getBytes("image_png"), userId);
        var cache = CacheControl.maxAge(Duration.ofSeconds(30)).cachePrivate();
        if (images.isEmpty()) {
            return ResponseEntity.noContent().cacheControl(cache).build();
        }
        byte[] image = images.get(0);
        return ResponseEntity.ok()
                .cacheControl(cache)
                .eTag(DigestUtils.md5DigestAsHex(image))
                .contentType(MediaType.IMAGE_PNG)
                .body(image);
    }

    @PutMapping("/api/users/{userId}/profile-image")
    @Transactional
    public ProfileImageResponse update(@PathVariable long userId, @CurrentUser long currentUserId,
                                       @RequestBody ProfileImageRequest request) {
        if (currentUserId != userId) {
            throw new ApiException(HttpStatus.FORBIDDEN, "내 프로필 이미지만 변경할 수 있어요.");
        }
        if (jdbc.queryForList("SELECT id FROM users WHERE id = ?", Long.class, userId).isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다.");
        }
        byte[] image = encodePng(decodeUpload(request.image()));
        jdbc.update("""
                INSERT INTO user_profile_image (user_id, image_png) VALUES (?, ?)
                ON DUPLICATE KEY UPDATE image_png = ?
                """, userId, image, image);
        return new ProfileImageResponse(Base64.getEncoder().encodeToString(image));
    }

    private byte[] decodeUpload(String image) {
        if (image == null || image.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "이미지를 선택해 주세요.");
        }
        if (image.length() > MAX_BASE64_LENGTH) {
            throw imageTooLarge();
        }
        byte[] bytes;
        try {
            bytes = Base64.getDecoder().decode(image);
        } catch (IllegalArgumentException exception) {
            throw invalidImage();
        }
        if (bytes.length > MAX_BYTES) {
            throw imageTooLarge();
        }
        return bytes;
    }

    private byte[] encodePng(byte[] bytes) {
        try (var input = new MemoryCacheImageInputStream(new ByteArrayInputStream(bytes))) {
            var readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) {
                throw invalidImage();
            }
            ImageReader reader = readers.next();
            try {
                String format = reader.getFormatName();
                if (!format.equalsIgnoreCase("JPEG") && !format.equalsIgnoreCase("PNG")) {
                    throw invalidImage();
                }
                reader.setInput(input, true, true);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if (width <= 0 || height <= 0 || width > MAX_INPUT_SIDE || height > MAX_INPUT_SIDE) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "이미지의 가로와 세로는 각각 4096px 이하여야 해요.");
                }
                int subsampling = Math.max(1, Math.max(width, height) / MAX_IMAGE_SIDE);
                ImageReadParam options = reader.getDefaultReadParam();
                options.setSourceSubsampling(subsampling, subsampling, 0, 0);
                BufferedImage image = resize(reader.read(0, options));
                var output = new ByteArrayOutputStream();
                ImageIO.write(image, "png", output);
                return output.toByteArray();
            } finally {
                reader.dispose();
            }
        } catch (IOException exception) {
            throw invalidImage();
        }
    }

    private BufferedImage resize(BufferedImage image) {
        int longestSide = Math.max(image.getWidth(), image.getHeight());
        double scale = Math.min(1.0, (double) MAX_IMAGE_SIDE / longestSide);
        int width = Math.max(1, (int) Math.round(image.getWidth() * scale));
        int height = Math.max(1, (int) Math.round(image.getHeight() * scale));
        BufferedImage scaled = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D graphics = scaled.createGraphics();
        try {
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            graphics.drawImage(image, 0, 0, width, height, null);
        } finally {
            graphics.dispose();
        }
        return scaled;
    }

    private ApiException invalidImage() {
        return new ApiException(HttpStatus.BAD_REQUEST, "읽을 수 있는 JPG 또는 PNG 이미지를 선택해 주세요.");
    }

    private ApiException imageTooLarge() {
        return new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "2MB 이하의 이미지를 선택해 주세요.");
    }

    public record ProfileImageRequest(String image) {
    }

    public record ProfileImageResponse(String image) {
    }
}
