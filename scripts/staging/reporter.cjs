const fs = require('node:fs');
const path = require('node:path');
class Reporter {
  onTestEnd(test, result) {
    this.infra = (result.errors || []).some(e => /browserType\.launch|Executable doesn't exist|Host system is missing/.test(e.message || ''));
  }
  onEnd(result) {
    fs.mkdirSync(process.env.HP_SMOKE_OUTPUT, { recursive: true });
    fs.writeFileSync(path.join(process.env.HP_SMOKE_OUTPUT, 'result.json'), JSON.stringify({
      passed: result.status === 'passed', code: result.status === 'passed' ? 'ok' : this.infra ? 'browser_infra' : 'browser_assertion',
    }));
  }
}
module.exports = Reporter;
