package com.retail.store;

import java.net.InetSocketAddress;
import java.net.Socket;
import java.util.HashMap;
import java.util.Map;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class RetailStoreApplication {
    public static void main(String[] args) {
        String mongoUri = System.getenv("MONGODB_URI");
        if (mongoUri == null || mongoUri.isBlank()) {
            mongoUri = "mongodb://localhost:27017/retail_store";
        }

        boolean mongoReachable = isMongoReachable(mongoUri);
        SpringApplication app = new SpringApplication(RetailStoreApplication.class);
        Map<String, Object> defaultProperties = new HashMap<>();

        if (mongoReachable) {
            System.out.println(">> [Retail Store API] Connected to MongoDB at " + mongoUri);
            defaultProperties.put("app.storage.mode", "mongodb");
        } else {
            System.out.println("==========================================================================");
            System.out.println(">> [Retail Store API] MongoDB not detected at " + mongoUri);
            System.out.println(">> Automatically operating in IN-MEMORY STORAGE mode (fully functional).");
            System.out.println(">> To persist to MongoDB, start MongoDB on 27017 and restart the app.");
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
            String host = "localhost";
            int port = 27017;
            if (uri != null && uri.startsWith("mongodb://")) {
                String clean = uri.substring("mongodb://".length());
                int atIdx = clean.indexOf('@');
                if (atIdx != -1) clean = clean.substring(atIdx + 1);
                int slashIdx = clean.indexOf('/');
                if (slashIdx != -1) clean = clean.substring(0, slashIdx);
                int colonIdx = clean.indexOf(':');
                if (colonIdx != -1) {
                    host = clean.substring(0, colonIdx);
                    port = Integer.parseInt(clean.substring(colonIdx + 1));
                } else {
                    host = clean;
                }
            }
            try (Socket socket = new Socket()) {
                socket.connect(new InetSocketAddress(host, port), 600);
                return true;
            }
        } catch (Exception e) {
            return false;
        }
    }
}
