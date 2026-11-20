package com.gdgoc.et.team;

import com.gdgoc.et.common.error.ApiException;
import com.gdgoc.et.team.RoomRepository.PersonRow;
import com.gdgoc.et.team.RoomRepository.RoomRow;
import com.gdgoc.et.team.RoomRepository.TagRow;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeamService {

    private final RoomRepository rooms;
    private final RoomMemberRepository members;
    private final JoinRequestRepository requests;
    private final JoinDraftWriter draftWriter;

    public record Tag(Long id, String name, String axis, boolean matched) {}

    public record RoomView(Long id, Long contestId, Long hostId, String hostName, String title, String intro,
                           int capacity, long memberCount, String status, long overlap, List<Tag> tags,
                           ContestView contest) {}

    public record ContestView(Long id, String title, String endDate, String applyUrl) {}

    public record RoomList(ContestView contest, List<RoomView> rooms) {}

    public record Person(Long id, Long userId, String name, String role, String message, String createdAt,
                         List<Tag> tags) {}

    public RoomList listRooms(Long contestId, Long userId) {
        return new RoomList(findContest(contestId), toViews(rooms.findRoomsForContest(contestId, userId), userId, false));
    }

    private ContestView findContest(Long contestId) {
        return contestId == null ? null : rooms.findContest(contestId)
                .map(c -> new ContestView(c.getId(), c.getTitle(), c.getEndDate(), c.getApplyUrl()))
                .orElse(null);
    }

    public record MyTeam(Long roomId, String title, String status, String role, int capacity, long memberCount,
                         ContestView contest) {}

    public List<MyTeam> listMyTeams(Long userId) {
        return rooms.findMyTeams(userId).stream()
                .map(t -> new MyTeam(t.getRoomId(), t.getTitle(), t.getStatus(), t.getRole(), t.getCapacity(),
                        t.getMemberCount(), t.getContestId() == null ? null
                        : new ContestView(t.getContestId(), t.getContestTitle(), t.getEndDate(), null)))
                .toList();
    }

    public Long findMyRoomId(Long userId, boolean hostOnly) {
        return rooms.findMyRoomId(userId, hostOnly).orElse(null);
    }

    public RoomView getRoom(Long roomId, Long userId) {
        RoomRow row = rooms.findRoomRow(roomId, userId).orElseThrow(() -> notFound("방"));
        return toViews(List.of(row), userId, true).get(0);
    }

    public String draftMessage(Long roomId, Long userId) {
        RoomRow room = rooms.findRoomRow(roomId, userId).orElseThrow(() -> notFound("방"));
        List<String> roomTags = rooms.findRoomTags(List.of(roomId)).stream().map(TagRow::getName).toList();
        List<String> userTags = rooms.findUserTags(List.of(userId)).stream().map(TagRow::getName).toList();
        String userName = rooms.findUserName(userId).orElseThrow(() -> notFound("사용자"));
        return draftWriter.write(new JoinDraftWriter.DraftInput(roomId, room.getTitle(), room.getIntro(), roomTags,
                userName, userTags));
    }

    @Transactional
    public void sendRequest(Long roomId, Long userId, String message) {
        Room room = rooms.findById(roomId).orElseThrow(() -> notFound("방"));
        if (room.getStatus() != Room.Status.RECRUITING) {
            throw conflict("모집이 끝난 방이에요");
        }
        if (members.existsByRoomIdAndUserId(roomId, userId)) {
            throw conflict("이미 이 방의 팀원이에요");
        }
        if (requests.existsByRoomIdAndUserIdAndStatus(roomId, userId, JoinRequest.Status.PENDING)) {
            throw conflict("이미 보낸 요청이 대기 중이에요");
        }
        requests.save(new JoinRequest(roomId, userId, message));
    }

    public List<Person> pendingRequests(Long roomId, Long userId) {
        Room room = rooms.findById(roomId).orElseThrow(() -> notFound("방"));
        requireHost(room, userId);
        Set<Long> roomTagIds = rooms.findRoomTags(List.of(roomId)).stream().map(TagRow::getId).collect(Collectors.toSet());
        return toPeople(rooms.findPendingRequests(roomId), roomTagIds);
    }

    public List<Person> listMembers(Long roomId) {
        rooms.findById(roomId).orElseThrow(() -> notFound("방"));
        return toPeople(rooms.findMembers(roomId), Set.of());
    }

    @Transactional
    public void accept(Long requestId, Long userId) {
        JoinRequest request = requests.findById(requestId).orElseThrow(() -> notFound("요청"));
        Room room = rooms.findForUpdate(request.getRoomId()).orElseThrow(() -> notFound("방"));
        requireHost(room, userId);
        requirePending(request);
        if (room.getStatus() != Room.Status.RECRUITING) {
            throw conflict("모집이 끝난 방이에요");
        }
        members.save(new RoomMember(room.getId(), request.getUserId(), RoomMember.Role.MEMBER));
        request.decide(JoinRequest.Status.ACCEPTED);
        if (members.countByRoomId(room.getId()) >= room.getCapacity()) {
            room.markFull();
            requests.findByRoomIdAndStatus(room.getId(), JoinRequest.Status.PENDING)
                    .forEach(r -> r.decide(JoinRequest.Status.REJECTED));
        }
    }

    @Transactional
    public void reject(Long requestId, Long userId) {
        JoinRequest request = requests.findById(requestId).orElseThrow(() -> notFound("요청"));
        Room room = rooms.findById(request.getRoomId()).orElseThrow(() -> notFound("방"));
        requireHost(room, userId);
        requirePending(request);
        request.decide(JoinRequest.Status.REJECTED);
    }

    private List<RoomView> toViews(List<RoomRow> rows, Long userId, boolean withContest) {
        Map<Long, List<TagRow>> tagsByRoom = groupByOwner(rows.isEmpty() ? List.of()
                : rooms.findRoomTags(rows.stream().map(RoomRow::getId).toList()));
        Set<Long> myTagIds = userId == null ? Set.of()
                : rooms.findUserTags(List.of(userId)).stream().map(TagRow::getId).collect(Collectors.toSet());
        return rows.stream().map(r -> new RoomView(r.getId(), r.getContestId(), r.getHostId(), r.getHostName(),
                r.getTitle(), r.getIntro(), r.getCapacity(), r.getMemberCount(), r.getStatus(), r.getOverlap(),
                tagsByRoom.getOrDefault(r.getId(), List.of()).stream()
                        .map(t -> new Tag(t.getId(), t.getName(), t.getAxis(), myTagIds.contains(t.getId())))
                        .toList(),
                withContest ? findContest(r.getContestId()) : null))
                .toList();
    }

    private List<Person> toPeople(List<PersonRow> rows, Set<Long> matchTagIds) {
        Collection<Long> userIds = rows.stream().map(PersonRow::getUserId).toList();
        Map<Long, List<TagRow>> tagsByUser = groupByOwner(userIds.isEmpty() ? List.of() : rooms.findUserTags(userIds));
        return rows.stream().map(p -> new Person(p.getId(), p.getUserId(), p.getName(), p.getRole(), p.getMessage(),
                p.getCreatedAt(),
                tagsByUser.getOrDefault(p.getUserId(), List.of()).stream()
                        .map(t -> new Tag(t.getId(), t.getName(), t.getAxis(), matchTagIds.contains(t.getId())))
                        .toList()))
                .toList();
    }

    private static Map<Long, List<TagRow>> groupByOwner(List<TagRow> tags) {
        return tags.stream().collect(Collectors.groupingBy(TagRow::getOwnerId));
    }

    private static void requireHost(Room room, Long userId) {
        if (!room.isHost(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "방장만 할 수 있어요");
        }
    }

    private static void requirePending(JoinRequest request) {
        if (request.getStatus() != JoinRequest.Status.PENDING) {
            throw conflict("이미 처리된 요청이에요");
        }
    }

    private static ApiException notFound(String what) {
        return new ApiException(HttpStatus.NOT_FOUND, what + "을(를) 찾을 수 없어요");
    }

    private static ApiException conflict(String message) {
        return new ApiException(HttpStatus.CONFLICT, message);
    }
}
