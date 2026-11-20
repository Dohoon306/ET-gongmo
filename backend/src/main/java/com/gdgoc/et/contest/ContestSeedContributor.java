package com.gdgoc.et.contest;

import com.gdgoc.et.common.seed.SeedContributor;
import lombok.RequiredArgsConstructor;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(2)
@RequiredArgsConstructor
class ContestSeedContributor implements SeedContributor {

    private final ContestCollector collector;

    @Override
    public void seed() {
        collector.restoreLatestSnapshot();
    }
}
