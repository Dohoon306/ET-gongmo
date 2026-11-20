package com.gdgoc.et.team;

import com.gdgoc.et.common.web.CurrentUser;
import java.util.List;
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
public class ChatController {

    private final ChatService chatService;

    public record MessageBody(String content) {}

    @GetMapping("/rooms/{roomId}/messages")
    public List<ChatService.Message> roomMessages(@PathVariable long roomId, @CurrentUser Long userId,
                                                  @RequestParam(defaultValue = "0") long after) {
        return chatService.roomMessages(roomId, userId, after);
    }

    @PostMapping("/rooms/{roomId}/messages")
    public void sendRoomMessage(@PathVariable long roomId, @CurrentUser Long userId, @RequestBody MessageBody body) {
        chatService.sendRoomMessage(roomId, userId, body.content());
    }

    @GetMapping("/direct-messages")
    public List<ChatService.Conversation> conversations(@CurrentUser Long userId) {
        return chatService.conversations(userId);
    }

    @GetMapping("/direct-messages/{peerId}")
    public List<ChatService.Message> directMessages(@PathVariable long peerId, @CurrentUser Long userId,
                                                    @RequestParam(defaultValue = "0") long after) {
        return chatService.directMessages(userId, peerId, after);
    }

    @PostMapping("/direct-messages/{peerId}")
    public void sendDirectMessage(@PathVariable long peerId, @CurrentUser Long userId, @RequestBody MessageBody body) {
        chatService.sendDirectMessage(userId, peerId, body.content());
    }

    @GetMapping("/chat/unread")
    public ChatService.Unread unread(@CurrentUser Long userId) {
        return chatService.unread(userId);
    }
}
