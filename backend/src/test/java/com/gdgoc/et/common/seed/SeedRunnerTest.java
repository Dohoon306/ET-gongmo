package com.gdgoc.et.common.seed;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
import javax.sql.DataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;

class SeedRunnerTest {

    private final DataSource dataSource = mock(DataSource.class);
    private final Connection connection = mock(Connection.class);
    private final Statement statement = mock(Statement.class);
    private final ResultSet tableRows = mock(ResultSet.class);
    private final SeedContributor first = mock(SeedContributor.class);
    private final SeedContributor second = mock(SeedContributor.class);

    private final SeedRunner runner = new SeedRunner(dataSource, List.of(first, second));

    @BeforeEach
    void connectToSchemaWithTwoTables() throws SQLException {
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);
        when(statement.executeQuery(SeedRunner.CURRENT_SCHEMA_TABLES)).thenReturn(tableRows);
        when(tableRows.next()).thenReturn(true, true, false);
        when(tableRows.getString(1)).thenReturn("users", "room");
    }

    @Test
    void truncatesEveryTableWithForeignKeyChecksOffThenSeedsInOrder() throws SQLException {
        runner.run(null);

        InOrder order = inOrder(statement, connection, first, second);
        order.verify(statement).execute("SET FOREIGN_KEY_CHECKS = 0");
        order.verify(statement).execute("TRUNCATE TABLE `users`");
        order.verify(statement).execute("TRUNCATE TABLE `room`");
        order.verify(statement).execute("SET FOREIGN_KEY_CHECKS = 1");
        order.verify(connection).close();
        order.verify(first).seed();
        order.verify(second).seed();
    }

    @Test
    void turnsForeignKeyChecksBackOnAndSkipsSeedingWhenTruncateFails() throws SQLException {
        doThrow(new SQLException("잠김")).when(statement).execute("TRUNCATE TABLE `users`");

        assertThatThrownBy(() -> runner.run(null)).isInstanceOf(SQLException.class);

        verify(statement).execute("SET FOREIGN_KEY_CHECKS = 1");
        verify(first, never()).seed();
    }
}
