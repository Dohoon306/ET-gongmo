package com.gdgoc.et.user;

import com.gdgoc.et.common.error.ApiException;
import com.gdgoc.et.common.web.CurrentUser;
import com.gdgoc.et.user.ProfileEditService.MyAccount;
import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class ProfileEditController {

    private final ProfileEditService profileEdit;

    public record NameBody(String name) {}

    public record IntroBody(String intro) {}

    @GetMapping("/me")
    public MyAccount me(@CurrentUser Long userId) {
        return profileEdit.me(userId);
    }

    @PutMapping("/me/name")
    public MyAccount changeName(@CurrentUser Long userId, @RequestBody NameBody body) {
        return profileEdit.changeName(userId, body.name());
    }

    @PutMapping("/me/intro")
    public MyAccount changeIntro(@CurrentUser Long userId, @RequestBody IntroBody body) {
        return profileEdit.changeIntro(userId, body.intro());
    }

    @PutMapping(value = "/me/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public MyAccount changePhoto(@CurrentUser Long userId, @RequestParam("file") MultipartFile file) {
        try {
            return profileEdit.changePhoto(userId, file.getBytes());
        } catch (IOException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "사진을 읽지 못했어요");
        }
    }

    @DeleteMapping("/me/photo")
    public MyAccount deletePhoto(@CurrentUser Long userId) {
        return profileEdit.deletePhoto(userId);
    }

    @GetMapping("/{userId}/photo")
    public ResponseEntity<byte[]> photo(@PathVariable long userId) {
        return profileEdit.photo(userId)
                .map(photo -> ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(photo.contentType()))
                        .cacheControl(CacheControl.maxAge(Duration.ofDays(30)))
                        .header("X-Content-Type-Options", "nosniff")
                        .body(photo.data()))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "사진이 없어요"));
    }

    @GetMapping("/photo-versions")
    public Map<Long, Long> photoVersions() {
        return profileEdit.photoVersions();
    }
}
