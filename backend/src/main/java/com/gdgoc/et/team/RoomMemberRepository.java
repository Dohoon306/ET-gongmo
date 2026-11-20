package com.gdgoc.et.team;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomMemberRepository extends JpaRepository<RoomMember, Long> {

    long countByRoomId(Long roomId);

    boolean existsByRoomIdAndUserId(Long roomId, Long userId);
}
