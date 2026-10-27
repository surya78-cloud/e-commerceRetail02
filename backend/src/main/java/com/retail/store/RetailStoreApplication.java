package com.retail.store;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import com.mongodb.ConnectionString;
import com.mongodb.MongoException;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.bson.Document;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class RetailStoreApplication {
    public static void main(String[] args) {
        String storageMode = System.getenv().getOrDefault("APP_STORAGE_MODE", "auto").trim().toLowerCase();
        if (!storageMode.equals("auto") && !storageMode.equals("in-memory") && !storageMode.equals("mongodb")) {
            throw new IllegalArgumentException("APP_STORAGE_MODE must be auto, in-memory, or mongodb.");
        }

        boolean mongoReachable = false;
        if (!storageMode.equals("in-memory")) {
            String mongoUri = System.getenv("MONGODB_URI");
            if (mongoUri == null || mongoUri.isBlank()) {
                mongoUri = "mongodb://localhost:27017/retail_store";
            }
            mongoReachable = isMongoReachable(mongoUri);
        }

        SpringApplication app = new SpringApplication(RetailStoreApplication.class);
        Map<String, Object> defaultProperties = new HashMap<>();

        if (mongoReachable) {
            System.out.println(">> [Retail Store API] Connected to MongoDB.");
            defaultProperties.put("app.storage.mode", "mongodb");
        } else {
            System.out.println("==========================================================================");
            if (storageMode.equals("in-memory")) {
                System.out.println(">> [Retail Store API] IN-MEMORY STORAGE mode configured.");
            } else {
                System.out.println(">> [Retail Store API] MongoDB connection check failed.");
                System.out.println(">> Automatically operating in IN-MEMORY STORAGE mode (fully functional).");
            }
            System.out.println(">> Data is temporary and will be lost when the app restarts.");
            System.out.println("==========================================================================");
            defaultProperties.put("app.storage.mode", "in-memory");
            defaultProperties.put("spring.autoconfigure.exclude",
                    "org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration," +
                    "org.springframework.boot.autoconfigure.data.mongo.MongoDataAutoConfiguration," +
                    "org.springframework.boot.autoconfigure.data.mongo.MongoRepositoriesAutoConfiguration");
        }

        app.setDefaultProperties(defaultProperties);
        app.run(args);
    }

    private static boolean isMongoReachable(String uri) {
        try {
            MongoClientSettings settings = MongoClientSettings.builder()
                    .applyConnectionString(new ConnectionString(uri))
                    .applyToClusterSettings(cluster -> cluster.serverSelectionTimeout(600, TimeUnit.MILLISECONDS))
                    .build();
            try (MongoClient client = MongoClients.create(settings)) {
                client.getDatabase("admin").runCommand(new Document("ping", 1));
                return true;
            }
        } catch (MongoException | IllegalArgumentException e) {
            System.err.println(">> [Retail Store API] MongoDB connection check failed (" +
                    e.getClass().getSimpleName() + "); using in-memory storage.");
            return false;
        }
    }
}
