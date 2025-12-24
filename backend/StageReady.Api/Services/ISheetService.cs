using StageReady.Api.DTOs;
using StageReady.Api.Models;

namespace StageReady.Api.Services;

public interface ISheetService
{
    Task<IEnumerable<SheetSummaryResponse>> GetSheetsAsync(Guid userId, Guid? directoryId, int page, int pageSize);
    Task<SheetResponse?> GetSheetAsync(Guid sheetId, Guid userId);
    Task<SheetResponse> CreateSheetAsync(SheetInput input, Guid userId);
    Task<SheetResponse> UpdateSheetAsync(Guid sheetId, SheetInput input, Guid userId);
    Task DeleteSheetAsync(Guid sheetId, Guid userId);
    Task<SheetResponse> ImportSheetAsync(ImportSheetRequest request, Guid userId);
    Task<FormatSheetResponse> FormatSheetAsync(Guid sheetId, FormatSheetRequest request, Guid userId);
    Task<SheetResponse> TransposeSheetAsync(Guid sheetId, TransposeRequest request, Guid userId);
}
