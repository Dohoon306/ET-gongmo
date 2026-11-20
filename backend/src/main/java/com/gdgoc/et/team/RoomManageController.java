package com.gdgoc.et.team;

import com.gdgoc.et.common.web.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rooms/{roomId}")
@RequiredArgsConstructor
public class RoomManageController {

    private final RoomManageService rooms;

    public record KickBody(String reason) {}

    public record HostBody(long userId) {}

    @PostMapping("/members/{targetId}/kick")
    public void kick(@PathVariable long roomId, @PathVariable long targetId, @CurrentUser Long userId,
                     @RequestBody KickBody body) {
        rooms.kick(roomId, userId, targetId, body.reason());
    }

    @PostMapping("/leave")
    public void leave(@PathVariable long roomId, @CurrentUser Long userId) {
        rooms.leave(roomId, userId);
    }

    @PostMapping("/host")
    public void transferHost(@PathVariable long roomId, @CurrentUser Long userId, @RequestBody HostBody body) {
        rooms.transferHost(roomId, userId, body.userId());
    }

    @DeleteMapping
    public void deleteRoom(@PathVariable long roomId, @CurrentUser Long userId) {
        rooms.deleteRoom(roomId, userId);
    }
}
