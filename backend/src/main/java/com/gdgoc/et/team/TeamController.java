package com.gdgoc.et.team;

import com.gdgoc.et.common.web.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    public record JoinRequestBody(@NotBlank String message) {}

    public record MyRoom(Long roomId) {}

    @GetMapping("/my/teams")
    public List<TeamService.MyTeam> myTeams(@CurrentUser Long userId) {
        return teamService.listMyTeams(userId);
    }

    @GetMapping("/my/room")
    public MyRoom myRoom(@CurrentUser Long userId, @RequestParam(defaultValue = "false") boolean hostOnly) {
        return new MyRoom(teamService.findMyRoomId(userId, hostOnly));
    }

    @GetMapping("/contests/{contestId}/rooms")
    public TeamService.RoomList rooms(@PathVariable Long contestId, @CurrentUser(required = false) Long userId) {
        return teamService.listRooms(contestId, userId);
    }

    @GetMapping("/rooms/{roomId}")
    public TeamService.RoomView room(@PathVariable Long roomId, @CurrentUser(required = false) Long userId) {
        return teamService.getRoom(roomId, userId);
    }

    @PostMapping("/rooms/{roomId}/join-requests/draft")
    public Map<String, String> draft(@PathVariable Long roomId, @CurrentUser Long userId) {
        return Map.of("message", teamService.draftMessage(roomId, userId));
    }

    @PostMapping("/rooms/{roomId}/join-requests")
    public void sendRequest(@PathVariable Long roomId, @CurrentUser Long userId,
                            @Valid @RequestBody JoinRequestBody body) {
        teamService.sendRequest(roomId, userId, body.message());
    }

    @GetMapping("/rooms/{roomId}/join-requests")
    public List<TeamService.Person> pendingRequests(@PathVariable Long roomId, @CurrentUser Long userId) {
        return teamService.pendingRequests(roomId, userId);
    }

    @PostMapping("/join-requests/{requestId}/accept")
    public void accept(@PathVariable Long requestId, @CurrentUser Long userId) {
        teamService.accept(requestId, userId);
    }

    @PostMapping("/join-requests/{requestId}/reject")
    public void reject(@PathVariable Long requestId, @CurrentUser Long userId) {
        teamService.reject(requestId, userId);
    }

    @GetMapping("/rooms/{roomId}/members")
    public List<TeamService.Person> members(@PathVariable Long roomId) {
        return teamService.listMembers(roomId);
    }
}
