package com.gdgoc.et.team;

import jakarta.persistence.LockModeType;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface RoomRepository extends JpaRepository<Room, Long> {

    interface RoomRow {
        Long getId();
        Long getContestId();
        Long getHostId();
        String getTitle();
        String getIntro();
        Integer getCapacity();
        String getStatus();
        Long getOverlap();
        Long getMemberCount();
        String getHostName();
    }

    interface TagRow {
        Long getOwnerId();
        Long getId();
        String getName();
        String getAxis();
    }

    interface MyTeamRow {
        Long getRoomId();
        String getTitle();
        String getStatus();
        String getRole();
        Integer getCapacity();
        Long getMemberCount();
        Long getContestId();
        String getContestTitle();
        String getEndDate();
    }

    interface ContestRow {
        Long getId();
        String getTitle();
        String getEndDate();
        String getApplyUrl();
    }

    interface PersonRow {
        Long getId();
        Long getUserId();
        String getName();
        String getRole();
        String getMessage();
        String getCreatedAt();
    }

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Room r where r.id = :id")
    Optional<Room> findForUpdate(Long id);

    @Query(nativeQuery = true, value = """
            SELECT r.id, r.contest_id AS contestId, r.host_id AS hostId, r.title, r.intro, r.capacity, r.status,
                   COUNT(uc.category_id) AS overlap,
                   (SELECT COUNT(*) FROM room_member m WHERE m.room_id = r.id) AS memberCount,
                   (SELECT u.name FROM users u WHERE u.id = r.host_id) AS hostName
            FROM room r
            LEFT JOIN room_category rc ON rc.room_id = r.id
            LEFT JOIN user_category uc ON uc.category_id = rc.category_id AND uc.user_id = :userId
            WHERE r.contest_id = :contestId
              AND r.status IN ('RECRUITING', 'FULL')
            GROUP BY r.id
            ORDER BY (r.status = 'FULL') ASC, overlap DESC, r.created_at DESC
            """)
    List<RoomRow> findRoomsForContest(Long contestId, Long userId);

    @Query(nativeQuery = true, value = """
            SELECT r.id, r.contest_id AS contestId, r.host_id AS hostId, r.title, r.intro, r.capacity, r.status,
                   COUNT(uc.category_id) AS overlap,
                   (SELECT COUNT(*) FROM room_member m WHERE m.room_id = r.id) AS memberCount,
                   (SELECT u.name FROM users u WHERE u.id = r.host_id) AS hostName
            FROM room r
            LEFT JOIN room_category rc ON rc.room_id = r.id
            LEFT JOIN user_category uc ON uc.category_id = rc.category_id AND uc.user_id = :userId
            WHERE r.id = :roomId
            GROUP BY r.id
            """)
    Optional<RoomRow> findRoomRow(Long roomId, Long userId);

    @Query(nativeQuery = true, value = """
            SELECT rc.room_id AS ownerId, c.id, c.name, c.axis
            FROM room_category rc JOIN category c ON c.id = rc.category_id
            WHERE rc.room_id IN (:roomIds)
            ORDER BY c.sort_order
            """)
    List<TagRow> findRoomTags(Collection<Long> roomIds);

    @Query(nativeQuery = true, value = """
            SELECT uc.user_id AS ownerId, c.id, c.name, c.axis
            FROM user_category uc JOIN category c ON c.id = uc.category_id
            WHERE uc.user_id IN (:userIds)
            ORDER BY c.sort_order
            """)
    List<TagRow> findUserTags(Collection<Long> userIds);

    @Query(nativeQuery = true, value = "SELECT id, title, end_date AS endDate, COALESCE(source_url, gongmoa_url) AS applyUrl FROM contest WHERE id = :contestId")
    Optional<ContestRow> findContest(Long contestId);

    @Query(nativeQuery = true, value = """
            SELECT m.id, m.user_id AS userId, u.name, m.role, NULL AS message, NULL AS createdAt
            FROM room_member m JOIN users u ON u.id = m.user_id
            WHERE m.room_id = :roomId
            ORDER BY (m.role = 'HOST') DESC, m.joined_at, m.id
            """)
    List<PersonRow> findMembers(Long roomId);

    @Query(nativeQuery = true, value = """
            SELECT j.id, j.user_id AS userId, u.name, NULL AS role, j.message, DATE_FORMAT(j.created_at, '%Y-%m-%dT%H:%i:%s') AS createdAt
            FROM join_request j JOIN users u ON u.id = j.user_id
            WHERE j.room_id = :roomId AND j.status = 'PENDING'
            ORDER BY j.created_at, j.id
            """)
    List<PersonRow> findPendingRequests(Long roomId);

    @Query(nativeQuery = true, value = """
            SELECT r.id
            FROM room r
            JOIN room_member m ON m.room_id = r.id
            WHERE m.user_id = :userId
              AND r.status IN ('RECRUITING', 'FULL')
              AND (:hostOnly = FALSE OR m.role = 'HOST')
            ORDER BY m.joined_at DESC, r.id DESC
            LIMIT 1
            """)
    Optional<Long> findMyRoomId(Long userId, boolean hostOnly);

    @Query(nativeQuery = true, value = """
            SELECT r.id AS roomId, r.title, r.status, m.role, r.capacity,
                   (SELECT COUNT(*) FROM room_member x WHERE x.room_id = r.id) AS memberCount,
                   c.id AS contestId, c.title AS contestTitle, c.end_date AS endDate
            FROM room_member m
            JOIN room r ON r.id = m.room_id
            LEFT JOIN contest c ON c.id = r.contest_id
            WHERE m.user_id = :userId
              AND r.status IN ('RECRUITING', 'FULL')
            ORDER BY m.joined_at DESC, r.id DESC
            """)
    List<MyTeamRow> findMyTeams(Long userId);
}
