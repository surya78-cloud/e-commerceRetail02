package com.retail.store.config;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import com.retail.store.model.Product;
import com.retail.store.repository.ProductRepository;

@Configuration
public class DemoData {
    @Bean
    CommandLineRunner seedProducts(ProductRepository products) {
        return args -> {
            if (products.count() > 0) return;
            products.saveAll(List.of(
                    new Product("Canvas Weekender", "BAG-204", "Accessories", new BigDecimal("84.00"), 18, "A durable carryall for long weekends."),
                    new Product("Everyday Ceramic Set", "HOM-118", "Home", new BigDecimal("46.50"), 4, "Hand-finished stoneware for daily use."),
                    new Product("Wool Blend Overshirt", "APP-392", "Apparel", new BigDecimal("112.00"), 12, "A structured midweight layer."),
                    new Product("Ribbed Glass Pair", "HOM-073", "Home", new BigDecimal("28.00"), 31, "Textured glassware, set of two."),
                    new Product("Leather Card Case", "ACC-251", "Accessories", new BigDecimal("39.00"), 3, "Slim full-grain leather card holder."),
                    new Product("Linen Market Tote", "BAG-142", "Accessories", new BigDecimal("32.00"), 23, "Lightweight everyday market bag.")
            ));
        };
    }
}