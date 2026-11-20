package com.gdgoc.et.team;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JoinRequestRepository extends JpaRepository<JoinRequest, Long> {

    boolean existsByRoomIdAndUserIdAndStatus(Long roomId, Long userId, JoinRequest.Status status);

    List<JoinRequest> findByRoomIdAndStatus(Long roomId, JoinRequest.Status status);
}
