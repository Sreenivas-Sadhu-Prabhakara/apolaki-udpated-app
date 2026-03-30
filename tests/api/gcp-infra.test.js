/**
 * GCP Infrastructure File Validation Tests
 * ──────────────────────────────────────────────────────────────
 * Validates that all required GCP migration files exist and
 * have correct structure. No network calls — pure file checks.
 *
 * Usage:
 *   cd tests && npx mocha --timeout 10000 'api/gcp-infra.test.js'
 *
 * @tags migration, infra, offline
 */

import { expect } from 'chai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

function fileExists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function readFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf-8');
}

describe('GCP Infrastructure Validation', function () {

  // ════════════════════════════════════════════════════════════════════
  // Cloud Build Configs
  // ════════════════════════════════════════════════════════════════════
  describe('Cloud Build Configs', function () {
    const configs = [
      { file: 'cloudbuild.yaml', service: 'db-service' },
      { file: 'cloudbuild-frontend.yaml', service: 'frontend' },
      { file: 'cloudbuild-solar.yaml', service: 'solar-service' },
    ];

    for (const { file, service } of configs) {
      it(`should have ${file} for ${service}`, function () {
        expect(fileExists(file), `${file} missing`).to.be.true;
      });

      it(`${file} should reference apolaki-repo Artifact Registry`, function () {
        const content = readFile(file);
        expect(content).to.include('apolaki-repo');
      });

      it(`${file} should be valid YAML structure`, function () {
        const content = readFile(file);
        expect(content).to.include('steps:');
      });
    }
  });

  // ════════════════════════════════════════════════════════════════════
  // Firebase Hosting
  // ════════════════════════════════════════════════════════════════════
  describe('Firebase Hosting', function () {
    it('should have firebase.json', function () {
      expect(fileExists('firebase.json')).to.be.true;
    });

    it('firebase.json should configure hosting', function () {
      const content = JSON.parse(readFile('firebase.json'));
      expect(content).to.have.property('hosting');
    });

    it('should have .firebaserc with project ID', function () {
      expect(fileExists('.firebaserc')).to.be.true;
      const content = JSON.parse(readFile('.firebaserc'));
      expect(content).to.have.property('projects');
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // Docker Configs
  // ════════════════════════════════════════════════════════════════════
  describe('Docker Configs', function () {
    it('should have backend Dockerfile', function () {
      expect(fileExists('middleware/netlify-db-service/Dockerfile')).to.be.true;
    });

    it('backend Dockerfile should expose PORT env var', function () {
      const content = readFile('middleware/netlify-db-service/Dockerfile');
      expect(content).to.match(/PORT|EXPOSE/);
    });

    it('should have backend .dockerignore', function () {
      expect(fileExists('middleware/netlify-db-service/.dockerignore')).to.be.true;
    });

    it('should have solar service Dockerfile', function () {
      expect(fileExists('middleware/solar-service/Dockerfile')).to.be.true;
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // GCP Environment Config
  // ════════════════════════════════════════════════════════════════════
  describe('GCP Environment Config', function () {
    it('should have .env.gcp template', function () {
      expect(fileExists('config/env/.env.gcp')).to.be.true;
    });

    it('.env.gcp should contain all required sections', function () {
      const content = readFile('config/env/.env.gcp');
      const requiredSections = [
        'GCP_PROJECT_ID',
        'DATABASE_URL',
        'JWT_SECRET',
        'API_PORT',
        'VITE_API_URL',
      ];
      for (const section of requiredSections) {
        expect(content, `Missing ${section}`).to.include(section);
      }
    });

    it('.env.gcp should not contain actual secret values', function () {
      const content = readFile('config/env/.env.gcp');
      // All secret fields should have placeholder values
      const lines = content.split('\n').filter(l => l.includes('=') && !l.startsWith('#'));
      for (const line of lines) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        if (key.includes('SECRET') || key.includes('PASSWORD') || key.includes('TOKEN')) {
          expect(value).to.satisfy(
            v => v === 'CHANGE_ME' || v === '' || v.includes('CHANGE'),
            `${key.trim()} should have a placeholder value, got: ${value}`
          );
        }
      }
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // Migration Scripts
  // ════════════════════════════════════════════════════════════════════
  describe('Migration Scripts', function () {
    const scripts = [
      'scripts/gcp-migration/deploy-backend.sh',
      'scripts/gcp-migration/deploy-solar.sh',
      'scripts/gcp-migration/deploy-frontend.sh',
      'scripts/gcp-migration/setup-secrets-gcp.sh',
      'scripts/gcp-migration/upload-assets.sh',
      'scripts/gcp-migration/setup-monitoring.sh',
    ];

    for (const script of scripts) {
      it(`should have ${path.basename(script)}`, function () {
        expect(fileExists(script), `${script} missing`).to.be.true;
      });

      it(`${path.basename(script)} should be executable`, function () {
        const stats = fs.statSync(path.join(ROOT, script));
        const isExecutable = (stats.mode & 0o111) !== 0;
        expect(isExecutable, `${script} is not executable`).to.be.true;
      });

      it(`${path.basename(script)} should have set -euo pipefail`, function () {
        const content = readFile(script);
        expect(content).to.include('set -euo pipefail');
      });
    }
  });

  // ════════════════════════════════════════════════════════════════════
  // Deploy Scripts — Secret Manager Integration
  // ════════════════════════════════════════════════════════════════════
  describe('Deploy Scripts → Secret Manager', function () {
    it('deploy-backend.sh should use --set-secrets', function () {
      const content = readFile('scripts/gcp-migration/deploy-backend.sh');
      expect(content).to.include('--set-secrets');
      expect(content).to.include('DATABASE_URL=DATABASE_URL:latest');
      expect(content).to.include('JWT_SECRET=JWT_SECRET:latest');
    });

    it('deploy-solar.sh should use --set-secrets', function () {
      const content = readFile('scripts/gcp-migration/deploy-solar.sh');
      expect(content).to.include('--set-secrets');
      expect(content).to.include('GOOGLE_SOLAR_API_KEY=GOOGLE_SOLAR_API_KEY:latest');
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // Backend Code — No Netlify Remnants
  // ════════════════════════════════════════════════════════════════════
  describe('Backend Code Cleanup', function () {
    it('server.js should not reference Lambda or Netlify detection', function () {
      const content = readFile('middleware/netlify-db-service/src/server.js');
      expect(content).to.not.include('LAMBDA_TASK_ROOT');
      expect(content).to.not.include('AWS_LAMBDA_FUNCTION_NAME');
      expect(content).to.not.include('serverless-http');
    });

    it('db.js should support both neon and pg providers', function () {
      const content = readFile('middleware/netlify-db-service/src/db.js');
      expect(content).to.include('@neondatabase/serverless');
      expect(content).to.include('DB_PROVIDER');
      expect(content).to.include('createPgSqlInterface');
    });

    it('db.js should use DATABASE_URL as primary connection string', function () {
      const content = readFile('middleware/netlify-db-service/src/db.js');
      expect(content).to.include('process.env.DATABASE_URL');
    });

    it('package.json should not have @netlify/neon', function () {
      const pkg = JSON.parse(readFile('middleware/netlify-db-service/package.json'));
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };
      expect(allDeps).to.not.have.property('@netlify/neon');
    });

    it('package.json should have @neondatabase/serverless', function () {
      const pkg = JSON.parse(readFile('middleware/netlify-db-service/package.json'));
      expect(pkg.dependencies).to.have.property('@neondatabase/serverless');
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // Config Manager — GCP Compatibility
  // ════════════════════════════════════════════════════════════════════
  describe('Config Manager', function () {
    it('should read DATABASE_URL from environment', function () {
      const content = readFile('config/config.manager.js');
      expect(content).to.include("process.env.DATABASE_URL");
    });

    it('should read PORT env var (Cloud Run compatibility)', function () {
      const content = readFile('config/config.manager.js');
      expect(content).to.include("process.env.PORT");
    });

    it('should have OAuth config for all providers', function () {
      const content = readFile('config/config.manager.js');
      expect(content).to.include('OAUTH_GOOGLE_CLIENT_ID');
      expect(content).to.include('OAUTH_FACEBOOK_CLIENT_ID');
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // Netlify Archival
  // ════════════════════════════════════════════════════════════════════
  describe('Netlify Archival', function () {
    it('should have archived netlify.toml', function () {
      expect(fileExists('archived/netlify.toml.archived')).to.be.true;
    });

    it('netlify.toml should no longer be in root', function () {
      expect(fileExists('netlify.toml')).to.be.false;
    });

    it('old deploy workflows should be archived', function () {
      expect(fileExists('.github/workflows/archived/deploy.yml.archived')).to.be.true;
      expect(fileExists('.github/workflows/archived/docker-build.yml.archived')).to.be.true;
    });

    it('CI workflows (tests) should still be active', function () {
      expect(fileExists('.github/workflows/backend-ci.yml')).to.be.true;
      expect(fileExists('.github/workflows/frontend-ci.yml')).to.be.true;
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // Migration Documentation
  // ════════════════════════════════════════════════════════════════════
  describe('Migration Documentation', function () {
    it('should have GCP Migration Plan', function () {
      expect(fileExists('docs/GCP_MIGRATION_PLAN.md')).to.be.true;
    });

    it('should have GCP Migration State', function () {
      expect(fileExists('docs/GCP_MIGRATION_STATE.md')).to.be.true;
    });

    it('migration plan should cover all 8 phases', function () {
      const content = readFile('docs/GCP_MIGRATION_PLAN.md');
      for (let i = 0; i <= 8; i++) {
        expect(content, `Missing PHASE ${i}`).to.include(`PHASE ${i}`);
      }
    });
  });
});
