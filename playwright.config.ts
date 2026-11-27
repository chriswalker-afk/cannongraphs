import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
 testDir:'./browser',timeout:90000,expect:{timeout:12000},fullyParallel:true,workers:2,retries:0,
 reporter:[['list'],['html',{open:'never'}]],
 use:{...devices['Desktop Chrome'],baseURL:'http://127.0.0.1:4173',reducedMotion:'reduce',trace:'retain-on-failure',screenshot:'only-on-failure',video:'off'},
 webServer:{command:'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI,timeout:30000}
});
