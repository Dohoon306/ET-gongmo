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
@Table(name = "room_member")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RoomMember {

    public enum Role { HOST, MEMBER }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long roomId;

    private Long userId;

    @Enumerated(EnumType.STRING)
    private Role role;

    public RoomMember(Long roomId, Long userId, Role role) {
        this.roomId = roomId;
        this.userId = userId;
        this.role = role;
    }
}
