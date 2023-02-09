using AppLensV3.Services;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System;
using System.Net;
using System.Threading.Tasks;

namespace AppLensV3.Controllers
{
    [Route("api/openai")]
    [Produces("application/json")]
    public class OpenAIController : Controller
    {
        private IOpenAIService _openAIService;
        public OpenAIController(IOpenAIService openAIService)
        {
            _openAIService = openAIService;
        }

        [HttpGet("enabled")]
        public async Task<IActionResult> IsEnabled()
        {
            return Ok(_openAIService.IsEnabled());
        }

        [HttpPost("runTextCompletion")]
        public async Task<IActionResult> RunTextCompletion([FromBody] CompletionModel completionModel)
        {
            if (completionModel == null || completionModel.Payload == null)
            {
                return BadRequest("Please provide completion payload in the request body");
            }
            try
            {
                var response = await _openAIService.RunTextCompletion(completionModel);
                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadAsStringAsync();
                    return Ok(JsonConvert.DeserializeObject(result));
                }
                else
                {
                    if (response.StatusCode == HttpStatusCode.BadRequest) {
                        return BadRequest("Malformed request");
                    }
                    return new StatusCodeResult(500);
                }
            }
            catch(Exception ex)
            {
                //Log exception
                return new StatusCodeResult(500);
            }
        }
    }
}
