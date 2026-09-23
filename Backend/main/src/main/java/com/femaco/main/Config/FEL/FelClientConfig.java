package com.femaco.main.Config.FEL;

import java.time.Duration;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(FelProperties.class)
public class FelClientConfig {

    @Bean
    public RestClient felRestClient(FelProperties props) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofMillis(props.getTimeout().getConnectMs()));
        requestFactory.setReadTimeout(Duration.ofMillis(props.getTimeout().getReadMs()));

        return RestClient.builder()
                .requestFactory(requestFactory)
                .build();
    }
}