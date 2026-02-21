# CONTEXT — Joomla 6 Green Office
> Pointers to existing docs. Do not duplicate content here.
> _Updated: 2026-02-21_

## Existing Reference Docs (in repo root)
| Doc | What's in it |
|-----|-------------|
| `AGENTS.md` | Stack, Docker commands, DB creds, URL map, file permissions, Joomla CLI |
| `Docker_GreenOffice_Joomla6_Stack_Summary.md` | Docker compose service details |
| `QUICK_REFERENCE.md` | Short cheatsheet for common ops |
| `DEPLOYMENT_GUIDE.md` | Full deploy procedure |
| `INSTALLATION_GUIDE.md` | Initial Joomla install steps |
| `TROUBLESHOOTING_NETWORK.md` | Nginx proxy / network issues |
| `CONNECTION_TROUBLESHOOTING.md` | DB connection issues |
| `backups/Context-Mission2.md` | Original content spec (17 child pages, dashboard HTML template) |
| `backups/gane.txt` | Thai titles + aliases for all 17 Green Office sub-items |

## Key Paths (inside `rgreenoff` container)
```
/var/www/html/                          Joomla root
/var/www/html/configuration.php         Main config (owner: www-data)
/var/www/html/plugins/content/
  go_clearcache/                        Cache-clear plugin
  go_statussync/                        Status-emoji sync plugin
/var/www/html/modules/mod_go_dashboard/ Dashboard module
/var/www/html/administrator/cache/      Admin cache (clear on article save)
```

## Key Paths (host)
```
/home/rae_admin/joomla-greenoffice/
  docker-compose.yml
  joomla_data/        → mounted as /var/www/html
  mariadb_data/       → MariaDB storage
  backups/            → DB + file backups
  MEMORY/             → Agent memory (this dir)
  LOGS/               → Dated session logs
  RUNBOOK/            → Operational playbooks
```

## DB Quick Facts
- Prefix: `j6_`
- Content: `j6_content` (articles), `j6_categories`, `j6_menu`, `j6_assets`
- Custom fields: `j6_fields`, `j6_fields_values`, `j6_fields_groups`, `j6_fields_categories`
- Modules: `j6_modules`, `j6_modules_menu`
- Plugins: `j6_extensions` (type='plugin', folder='content')
- Workflows: `j6_workflow_associations` (required for articles to appear in Admin list)

## Agent Session History
- Full transcript: `4f23397b-427e-4a8d-bf86-131bcfea5fcb` (in agent-transcripts)
- Summary: see `LOGS/2026-02-21.md`
