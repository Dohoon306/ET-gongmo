package com.gdgoc.et.contest;

import java.nio.file.Path;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("app.contest-collection")
public record ContestCollectionProperties(
        String endpoint,
        List<String> fields,
        String target,
        int limit,
        Path snapshotDirectory) {

    public ContestCollectionProperties {
        endpoint = endpoint == null || endpoint.isBlank() ? "https://www.gongmoaview.com/mcp" : endpoint;
        fields = fields == null || fields.isEmpty() ? List.of("it", "idea", "design", "video", "marketing") : List.copyOf(fields);
        target = target == null || target.isBlank() ? "univ" : target;
        limit = limit <= 0 ? 20 : Math.min(limit, 20);
        snapshotDirectory = snapshotDirectory == null ? Path.of("data", "contest-snapshots") : snapshotDirectory;
    }
}
