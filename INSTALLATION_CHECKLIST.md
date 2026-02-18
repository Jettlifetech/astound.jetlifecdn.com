# Installation Checklist

Use this checklist to ensure proper installation of the Prompt Template Manager.

## ☑️ Pre-Installation

- [ ] PHP 7.4 or higher installed
- [ ] MySQL 5.7 or higher installed
- [ ] Apache web server running
- [ ] PDO and PDO_MySQL PHP extensions enabled
- [ ] Project files uploaded to web directory

## ☑️ Configuration

- [ ] Edited `config/database.php` with MySQL credentials
  - [ ] Updated DB_USER
  - [ ] Updated DB_PASS
  - [ ] Updated DB_HOST (if not localhost)
  - [ ] Updated DB_NAME (if different from prompt_db)

## ☑️ Database Setup

Choose ONE method:

### Method 1: Using setup.php (Recommended)
- [ ] Accessed `http://your-domain/setup.php` in browser
- [ ] Verified all green checkmarks
- [ ] Clicked "Initialize Database" if needed
- [ ] **Deleted setup.php after successful setup**

### Method 2: Manual MySQL
- [ ] Logged into MySQL: `mysql -u root -p`
- [ ] Ran: `source /var/www/prompt-db.dainedvorak.com/database/schema.sql`
- [ ] Verified tables created: `SHOW TABLES;`
- [ ] Exited MySQL: `exit`

## ☑️ Permissions

- [ ] Set ownership: `sudo chown -R www-data:www-data /var/www/prompt-db.dainedvorak.com/`
- [ ] Set permissions: `sudo chmod -R 755 /var/www/prompt-db.dainedvorak.com/`
- [ ] Verified API directory is accessible
- [ ] Verified .htaccess is readable

## ☑️ Web Server Configuration

### Apache
- [ ] Created or updated virtual host configuration
- [ ] Enabled mod_rewrite: `sudo a2enmod rewrite`
- [ ] Enabled site (if using vhost): `sudo a2ensite prompt-db.dainedvorak.com`
- [ ] Restarted Apache: `sudo systemctl restart apache2`

### Testing Apache Config
- [ ] Tested config: `sudo apache2ctl configtest`
- [ ] No errors reported

## ☑️ Testing

### Basic Functionality
- [ ] Accessed home page: `http://your-domain/`
- [ ] Page loads without errors
- [ ] Navigation menu works (all 3 pages)
- [ ] No JavaScript console errors

### Template Creation
- [ ] Accessed Template Creator page
- [ ] Created test template with variables
- [ ] Parsed variables successfully
- [ ] Configured variable labels and types
- [ ] Saved template without errors
- [ ] Template appears in existing templates list

### Prompt Generation
- [ ] Returned to home page
- [ ] Template appears in dropdown
- [ ] Selected template
- [ ] Variable fields loaded dynamically
- [ ] Filled in all fields
- [ ] Generated prompt successfully
- [ ] Copied prompt to clipboard

### History
- [ ] Accessed History page
- [ ] Generated prompt appears in history
- [ ] Created template appears in history
- [ ] Filter buttons work (All/Prompts/Templates/Errors)
- [ ] Statistics show correct counts

### API Testing
- [ ] Test templates API: `curl http://your-domain/api/templates.php`
- [ ] Test history API: `curl http://your-domain/api/history.php`
- [ ] Both return valid JSON

## ☑️ Security

- [ ] Deleted `setup.php` file
- [ ] Changed database password from default
- [ ] .htaccess file is active
- [ ] Directory listing is disabled
- [ ] PHP display_errors is Off (production)

## ☑️ Optional Configuration

- [ ] Configured custom domain
- [ ] Enabled HTTPS/SSL
- [ ] Set up database backups
- [ ] Configured error logging
- [ ] Set up monitoring

## 🔍 Troubleshooting

### If pages don't load:
```bash
# Check Apache error log
sudo tail -f /var/log/apache2/error.log

# Check Apache status
sudo systemctl status apache2

# Restart Apache
sudo systemctl restart apache2
```

### If database connection fails:
```bash
# Check MySQL status
sudo systemctl status mysql

# Test connection
mysql -u your_username -p

# Verify database exists
mysql -u your_username -p -e "SHOW DATABASES;"
```

### If API returns errors:
```bash
# Check PHP error log
sudo tail -f /var/log/apache2/error.log

# Verify PHP extensions
php -m | grep -i pdo

# Test API directly
curl -v http://your-domain/api/templates.php
```

### If permissions errors occur:
```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/prompt-db.dainedvorak.com/

# Fix permissions
sudo chmod -R 755 /var/www/prompt-db.dainedvorak.com/
sudo chmod 644 /var/www/prompt-db.dainedvorak.com/.htaccess
```

## ✅ Post-Installation

- [ ] Documented database credentials (securely)
- [ ] Bookmarked application URL
- [ ] Read README.md for full documentation
- [ ] Read QUICKSTART.md for usage examples
- [ ] Created backup of database
- [ ] Shared access with team members (if applicable)

## 📝 Notes

Installation Date: _______________

Installed By: _______________

Domain/URL: _______________

Database Name: _______________

Issues Encountered:
- _______________
- _______________
- _______________

## 🎉 Success!

If all items are checked, your Prompt Template Manager is ready to use!

Next steps:
1. Create your first template
2. Generate your first prompt
3. Explore the History page
4. Share with your team

For support, refer to:
- README.md - Full documentation
- QUICKSTART.md - Quick start guide
- History page - Error logs (if any)
