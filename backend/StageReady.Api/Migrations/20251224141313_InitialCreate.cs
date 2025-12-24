using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StageReady.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    external_sub = table.Column<string>(type: "text", nullable: true),
                    email = table.Column<string>(type: "text", nullable: false),
                    password_hash = table.Column<string>(type: "text", nullable: true),
                    display_name = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "directories",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_directories", x => x.id);
                    table.ForeignKey(
                        name: "FK_directories_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "preferences",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    font_scale = table.Column<double>(type: "double precision", nullable: false),
                    theme = table.Column<string>(type: "text", nullable: false),
                    auto_scroll = table.Column<bool>(type: "boolean", nullable: false),
                    scroll_bpm = table.Column<int>(type: "integer", nullable: true),
                    high_contrast = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_preferences", x => x.id);
                    table.ForeignKey(
                        name: "FK_preferences_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "providers",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    pat_cipher = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_providers", x => x.id);
                    table.ForeignKey(
                        name: "FK_providers_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "sheets",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    artist = table.Column<string>(type: "text", nullable: true),
                    key = table.Column<string>(type: "text", nullable: true),
                    capo = table.Column<int>(type: "integer", nullable: true),
                    format = table.Column<string>(type: "text", nullable: false),
                    body = table.Column<string>(type: "text", nullable: false),
                    source = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sheets", x => x.id);
                    table.ForeignKey(
                        name: "FK_sheets_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "setlists",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    directory_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_setlists", x => x.id);
                    table.ForeignKey(
                        name: "FK_setlists_directories_directory_id",
                        column: x => x.directory_id,
                        principalTable: "directories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "sheet_versions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    sheet_id = table.Column<Guid>(type: "uuid", nullable: false),
                    body = table.Column<string>(type: "text", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sheet_versions", x => x.id);
                    table.ForeignKey(
                        name: "FK_sheet_versions_sheets_sheet_id",
                        column: x => x.sheet_id,
                        principalTable: "sheets",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "setlist_items",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    setlist_id = table.Column<Guid>(type: "uuid", nullable: false),
                    sheet_id = table.Column<Guid>(type: "uuid", nullable: false),
                    position = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_setlist_items", x => x.id);
                    table.ForeignKey(
                        name: "FK_setlist_items_setlists_setlist_id",
                        column: x => x.setlist_id,
                        principalTable: "setlists",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_setlist_items_sheets_sheet_id",
                        column: x => x.sheet_id,
                        principalTable: "sheets",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_directories_user_id",
                table: "directories",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_preferences_user_id",
                table: "preferences",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_providers_user_id",
                table: "providers",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_setlist_items_setlist_id_position",
                table: "setlist_items",
                columns: new[] { "setlist_id", "position" });

            migrationBuilder.CreateIndex(
                name: "IX_setlist_items_sheet_id",
                table: "setlist_items",
                column: "sheet_id");

            migrationBuilder.CreateIndex(
                name: "IX_setlists_directory_id",
                table: "setlists",
                column: "directory_id");

            migrationBuilder.CreateIndex(
                name: "IX_sheet_versions_sheet_id",
                table: "sheet_versions",
                column: "sheet_id");

            migrationBuilder.CreateIndex(
                name: "IX_sheets_user_id_title",
                table: "sheets",
                columns: new[] { "user_id", "title" });

            migrationBuilder.CreateIndex(
                name: "IX_users_email",
                table: "users",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_external_sub",
                table: "users",
                column: "external_sub",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "preferences");

            migrationBuilder.DropTable(
                name: "providers");

            migrationBuilder.DropTable(
                name: "setlist_items");

            migrationBuilder.DropTable(
                name: "sheet_versions");

            migrationBuilder.DropTable(
                name: "setlists");

            migrationBuilder.DropTable(
                name: "sheets");

            migrationBuilder.DropTable(
                name: "directories");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
