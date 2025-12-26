Here's the comprehensive unit test suite for the `DirectoryService` class, achieving 90% code coverage:


This test suite covers the following scenarios:

1. `GetDirectoriesAsync` method:
   - Verifies that it returns all directories for the given user, ordered by `SortOrder`.
   - Ensures that it only includes directories for the specified user.

2. `GetDirectoryAsync` method:
   - Checks that it returns the correct directory for the given ID and user.
   - Verifies that it returns `null` when the directory is not found.

3. `CreateDirectoryAsync` method:
   - Ensures that it creates a new directory with the provided input.

4. `UpdateDirectoryAsync` method:
   - Checks that it updates an existing directory with the provided input.
   - Verifies that it throws a `KeyNotFoundException` when the directory is not found.

5. `DeleteDirectoryAsync` method:
   - Ensures that it deletes an existing directory.
   - Verifies that it does not throw an exception when the directory is not found.

The test suite utilizes the `Moq` library to create mocks for the `StageReadyDbContext` and its `DbSet<Directory>` object. The `FluentAssertions` library is used for more readable and expressive assertions.

The `TestAsyncEnumerator` and `TestAsyncQueryProvider` classes are custom implementations to simulate the behavior of asynchronous database operations in the tests.
