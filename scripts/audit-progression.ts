import {auditDifficulty,difficultyReport} from '../tests/helpers/difficultyAudit';
const rows=auditDifficulty();
process.stdout.write(difficultyReport(rows));
