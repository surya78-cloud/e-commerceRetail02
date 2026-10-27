package com.retail.store.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.retail.store.model.CustomerOrder;
import com.retail.store.model.Product;
import com.retail.store.repository.OrderRepository;
import com.retail.store.repository.ProductRepository;

class StoreServiceTest {
    private ProductRepository products;
    private OrderRepository orders;
    private StoreService service;

    @BeforeEach
    void setUp() {
        products = org.mockito.Mockito.mock(ProductRepository.class);
        orders = org.mockito.Mockito.mock(OrderRepository.class);
        service = new StoreService(products, orders);
    }

    @Test
    void placeOrderCalculatesTotalAndDecrementsStock() {
        Product product = new Product("Desk lamp", "LAMP-1", "Lighting", new BigDecimal("12.50"), 8, "");
        product.setId("product-1");
        when(products.findById("product-1")).thenReturn(Optional.of(product));
        when(orders.save(any(CustomerOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CustomerOrder result = service.placeOrder("Ari", List.of(new StoreService.RequestedItem("product-1", 2)));

        assertEquals(new BigDecimal("25.00"), result.getTotal());
        assertEquals("Ari", result.getCustomerName());
        assertEquals(1, result.getItems().size());
        assertEquals(2, result.getItems().get(0).getQuantity());
        assertEquals(6, product.getStock());
        verify(products).saveAll(anyList());
        verify(orders).save(any(CustomerOrder.class));
    }

    @Test
    void placeOrderAggregatesDuplicateItems() {
        Product product = new Product("Desk lamp", "LAMP-1", "Lighting", new BigDecimal("10.00"), 10, "");
        product.setId("product-1");
        when(products.findById("product-1")).thenReturn(Optional.of(product));
        when(orders.save(any(CustomerOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CustomerOrder result = service.placeOrder("Ari", List.of(
                new StoreService.RequestedItem("product-1", 2),
                new StoreService.RequestedItem("product-1", 3)
        ));

        assertEquals(new BigDecimal("50.00"), result.getTotal());
        assertEquals(1, result.getItems().size());
        assertEquals(5, result.getItems().get(0).getQuantity());
        assertEquals(5, product.getStock());
    }

    @Test
    void placeOrderRejectsEmptyItems() {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> service.placeOrder("Ari", List.of()));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        verify(products, never()).findById(any());
        verify(orders, never()).save(any());
    }

    @Test
    void placeOrderRejectsMissingProduct() {
        when(products.findById("missing")).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> service.placeOrder("Ari", List.of(new StoreService.RequestedItem("missing", 1))));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        verify(products, never()).saveAll(anyList());
        verify(orders, never()).save(any());
    }

    @Test
    void placeOrderRejectsInsufficientStock() {
        Product product = new Product("Desk lamp", "LAMP-1", "Lighting", new BigDecimal("12.50"), 1, "");
        product.setId("product-1");
        when(products.findById("product-1")).thenReturn(Optional.of(product));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> service.placeOrder("Ari", List.of(new StoreService.RequestedItem("product-1", 2))));

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        assertEquals(1, product.getStock());
        verify(products, never()).saveAll(anyList());
        verify(orders, never()).save(any());
    }

    @Test
    void placeOrderRejectsZeroQuantity() {
        Product product = new Product("Desk lamp", "LAMP-1", "Lighting", new BigDecimal("12.50"), 8, "");
        product.setId("product-1");
        when(products.findById("product-1")).thenReturn(Optional.of(product));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> service.placeOrder("Ari", List.of(new StoreService.RequestedItem("product-1", 0))));

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        assertEquals(8, product.getStock());
        verify(products, never()).saveAll(anyList());
        verify(orders, never()).save(any());
    }

    @Test
    void updateOrderStatusToCancelledRestoresStock() {
        Product product = new Product("Desk lamp", "LAMP-1", "Lighting", new BigDecimal("12.50"), 4, "");
        product.setId("product-1");
        when(products.findById("product-1")).thenReturn(Optional.of(product));

        CustomerOrder order = new CustomerOrder("Ari", List.of(
                new CustomerOrder.OrderItem("product-1", "Desk lamp", 2, new BigDecimal("12.50"))
        ), new BigDecimal("25.00"));
        order.setId("order-1");
        order.setStatus("Processing");

        when(orders.findById("order-1")).thenReturn(Optional.of(order));
        when(orders.save(any(CustomerOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CustomerOrder updated = service.updateOrderStatus("order-1", "Cancelled");

        assertEquals("Cancelled", updated.getStatus());
        assertEquals(6, product.getStock());
        verify(products).saveAll(anyList());
        verify(orders).save(order);
    }
}
