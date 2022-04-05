using AppLensV3.Models;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Azure.Documents;

namespace AppLensV3.Services
{
    public interface ICosmosDBUserSettingHandler : ICosmosDBHandlerBase<UserSetting>
    {
        Task<UserSetting> UpdateUserSettings(UserSetting userSettings);

        Task<UserSetting> GetItemAsync(string id);
    }
}
