package com.gdgoc.et.team;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "room")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Room {

    public enum Status { RECRUITING, FULL, CLOSED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long hostId;

    private int capacity;

    @Enumerated(EnumType.STRING)
    private Status status;

    public boolean isHost(Long userId) {
        return hostId.equals(userId);
    }

    public void markFull() {
        status = Status.FULL;
    }
}
