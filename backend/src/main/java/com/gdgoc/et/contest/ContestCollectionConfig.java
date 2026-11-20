package com.gdgoc.et.contest;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(ContestCollectionProperties.class)
class ContestCollectionConfig {
}
