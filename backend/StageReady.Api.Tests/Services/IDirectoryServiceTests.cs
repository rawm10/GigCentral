using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Moq;
using StageReady.Api.DTOs;
using Xunit;

namespace StageReady.Api.Services.Tests
{
    public class DirectoryServiceTests
    {
        private readonly Mock<IDirectoryService> _directoryServiceMock;
        private readonly DirectoryService _directoryService;

        public DirectoryServiceTests()
        {
            _directoryServiceMock = new Mock<IDirectoryService>();
            _directoryService = new DirectoryService(_directoryServiceMock.Object);
        }

        [Fact]
        public async Task GetDirectoriesAsync_ShouldReturnListOfDirectories_WhenUserIdIsValid()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var directories = new List<DirectoryResponse>
            {
                new DirectoryResponse { Id = Guid.NewGuid(), Name = "Directory 1" },
                new DirectoryResponse { Id = Guid.NewGuid(), Name = "Directory 2" }
            };

            _directoryServiceMock.Setup(x => x.GetDirectoriesAsync(userId))
                .ReturnsAsync(directories);

            // Act
            var result = await _directoryService.GetDirectoriesAsync(userId);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(2);
            result.First().Name.Should().Be("Directory 1");
            result.Last().Name.Should().Be("Directory 2");
        }

        [Fact]
        public async Task GetDirectoryAsync_ShouldReturnDirectory_WhenIdAndUserIdAreValid()
        {
            // Arrange
            var id = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var directory = new DirectoryResponse { Id = id, Name = "Test Directory" };

            _directoryServiceMock.Setup(x => x.GetDirectoryAsync(id, userId))
                .ReturnsAsync(directory);

            // Act
            var result = await _directoryService.GetDirectoryAsync(id, userId);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().Be(id);
            result.Name.Should().Be("Test Directory");
        }

        [Fact]
        public async Task GetDirectoryAsync_ShouldReturnNull_WhenIdOrUserIdIsInvalid()
        {
            // Arrange
            var id = Guid.NewGuid();
            var userId = Guid.NewGuid();

            _directoryServiceMock.Setup(x => x.GetDirectoryAsync(id, userId))
                .ReturnsAsync((DirectoryResponse?)null);

            // Act
            var result = await _directoryService.GetDirectoryAsync(id, userId);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task CreateDirectoryAsync_ShouldReturnCreatedDirectory_WhenInputAndUserIdAreValid()
        {
            // Arrange
            var input = new DirectoryInput { Name = "New Directory" };
            var userId = Guid.NewGuid();
            var createdDirectory = new DirectoryResponse { Id = Guid.NewGuid(), Name = "New Directory" };

            _directoryServiceMock.Setup(x => x.CreateDirectoryAsync(input, userId))
                .ReturnsAsync(createdDirectory);

            // Act
            var result = await _directoryService.CreateDirectoryAsync(input, userId);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().NotBeEmpty();
            result.Name.Should().Be("New Directory");
        }

        [Fact]
        public async Task UpdateDirectoryAsync_ShouldReturnUpdatedDirectory_WhenIdInputAndUserIdAreValid()
        {
            // Arrange
            var id = Guid.NewGuid();
            var input = new DirectoryInput { Name = "Updated Directory" };
            var userId = Guid.NewGuid();
            var updatedDirectory = new DirectoryResponse { Id = id, Name = "Updated Directory" };

            _directoryServiceMock.Setup(x => x.UpdateDirectoryAsync(id, input, userId))
                .ReturnsAsync(updatedDirectory);

            // Act
            var result = await _directoryService.UpdateDirectoryAsync(id, input, userId);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().Be(id);
            result.Name.Should().Be("Updated Directory");
        }

        [Fact]
        public async Task DeleteDirectoryAsync_ShouldNotThrowException_WhenIdAndUserIdAreValid()
        {
            // Arrange
            var id = Guid.NewGuid();
            var userId = Guid.NewGuid();

            // Act
            await _directoryService.DeleteDirectoryAsync(id, userId);

            // Assert
            _directoryServiceMock.Verify(x => x.DeleteDirectoryAsync(id, userId), Times.Once);
        }
    }
