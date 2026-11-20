package com.gdgoc.et.team;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "join_request")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class JoinRequest {

    public enum Status { PENDING, ACCEPTED, REJECTED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long roomId;

    private Long userId;

    private String message;

    @Enumerated(EnumType.STRING)
    private Status status;

    private LocalDateTime decidedAt;

    public JoinRequest(Long roomId, Long userId, String message) {
        this.roomId = roomId;
        this.userId = userId;
        this.message = message;
        this.status = Status.PENDING;
    }

    public void decide(Status result) {
        status = result;
        decidedAt = LocalDateTime.now();
    }
}
