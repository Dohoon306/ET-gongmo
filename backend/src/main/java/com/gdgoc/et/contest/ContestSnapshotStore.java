package com.gdgoc.et.contest;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
class ContestSnapshotStore {

    private static final DateTimeFormatter FILE_TIME = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");

    private final ObjectMapper objectMapper;
    private final Path directory;

    ContestSnapshotStore(ObjectMapper objectMapper, ContestCollectionProperties properties) {
        this.objectMapper = objectMapper;
        this.directory = properties.snapshotDirectory();
    }

    Path save(List<ContestRecord> contests) {
        try {
            Files.createDirectories(directory);
            Path snapshot = directory.resolve("contest-" + FILE_TIME.format(LocalDateTime.now()) + ".json");
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(snapshot.toFile(), contests);
            return snapshot;
        } catch (IOException exception) {
            throw new IllegalStateException("공모전 스냅샷을 저장하지 못했습니다.", exception);
        }
    }

    List<ContestRecord> latest() {
        try (var snapshots = Files.list(directory)) {
            Path latest = snapshots
                    .filter(path -> path.getFileName().toString().startsWith("contest-"))
                    .filter(path -> path.getFileName().toString().endsWith(".json"))
                    .max(Comparator.comparing(path -> path.getFileName().toString()))
                    .orElseThrow(() -> new IllegalStateException("복구할 공모전 스냅샷이 없습니다."));
            return objectMapper.readValue(latest.toFile(), new TypeReference<>() {
            });
        } catch (IOException exception) {
            throw new IllegalStateException("공모전 스냅샷을 읽지 못했습니다.", exception);
        }
    }
}
