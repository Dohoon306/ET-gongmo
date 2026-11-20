package com.gdgoc.et.team;

import com.gdgoc.et.common.web.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class RoomCreateController {

    private final RoomCreateService roomCreateService;

    public record CreateRoomBody(
            @NotNull Long contestId,
            @NotBlank @Size(max = 100) String title,
            @Size(max = 1000) String intro,
            int capacity,
            @NotNull List<Long> categoryIds) {}

    @GetMapping("/api/rooms/contest-options")
    public List<RoomCreateService.ContestOption> contestOptions() {
        return roomCreateService.openContests();
    }

    @PostMapping("/api/rooms")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Long> create(@CurrentUser Long userId, @Valid @RequestBody CreateRoomBody body) {
        Long roomId = roomCreateService.create(userId, new RoomCreateService.NewRoom(
                body.contestId(), body.title(), body.intro(), body.capacity(), body.categoryIds()));
        return Map.of("roomId", roomId);
    }
}
