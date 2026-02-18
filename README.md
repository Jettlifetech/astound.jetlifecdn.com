# Prompt Template Manager

A Bootstrap 5 web application for creating, managing, and generating prompts from customizable templates with dynamic variable inputs.

## Features

- **Home Page**: Select prompt templates and generate custom prompts by filling in dynamic variables
- **Template Creator**: Create new prompt templates with variables marked as `[variable-name]`
- **History**: View complete history of templates created, prompts generated, and errors logged
- **Dynamic Form Generation**: Automatically creates input fields based on template variables
- **Variable Configuration**: Assign custom labels and data types (text, number, date, email, url, textarea) to each variable
- **MySQL Backend**: All data stored in local MySQL database

## Prerequisites

- PHP 7.4 or higher with PDO extension
- MySQL 5.7 or higher
- Apache web server (or any web server with PHP support)
- Modern web browser

## Installation

### 1. Clone or Download the Project

Place the project files in your web server directory (e.g., `/var/www/prompt-db.dainedvorak.com/`).

### 2. Configure Database

Edit the database configuration file:

```bash
nano config/database.php
```

Update the following constants with your MySQL credentials:

```php
define('DB_HOST', 'localhost');
define('DB_USER', 'your_mysql_username');
define('DB_PASS', 'your_mysql_password');
define('DB_NAME', 'prompt_db');
```

### 3. Create Database and Tables

Run the SQL schema file to create the database and tables:

```bash
mysql -u root -p < database/schema.sql
```

Or manually import via MySQL:

```bash
mysql -u root -p
source /var/www/prompt-db.dainedvorak.com/database/schema.sql
```

### 4. Set Permissions

Ensure the web server has read access to all files:

```bash
sudo chown -R www-data:www-data /var/www/prompt-db.dainedvorak.com/
sudo chmod -R 755 /var/www/prompt-db.dainedvorak.com/
```

### 5. Configure Web Server

#### Apache

If using Apache, create a virtual host configuration:

```apache
<VirtualHost *:80>
    ServerName prompt-db.dainedvorak.com
    DocumentRoot /var/www/prompt-db.dainedvorak.com
    
    <Directory /var/www/prompt-db.dainedvorak.com>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/prompt-db-error.log
    CustomLog ${APACHE_LOG_DIR}/prompt-db-access.log combined
</VirtualHost>
```

Enable the site and restart Apache:

```bash
sudo a2ensite prompt-db.dainedvorak.com
sudo systemctl restart apache2
```

### 6. Access the Application

Open your web browser and navigate to:
- `http://localhost/` (if running locally)
- `http://prompt-db.dainedvorak.com/` (if configured with domain)

## Usage

### Creating a Template

1. Navigate to **Create Template** page
2. Enter a template name
3. Write your prompt with variables in `[variable-name]` format
   - Example: `Write a [tone] email to [recipient] about [subject]`
4. Click **Parse Variables** to extract variables
5. Configure each variable:
   - Assign a user-friendly label
   - Select the appropriate input type
6. Click **Save Template**

### Generating a Prompt

1. Go to **Home** page
2. Select a template from the dropdown
3. Fill in the dynamically generated form fields
4. Click **Generate Prompt**
5. Copy the generated prompt using the **Copy to Clipboard** button

### Viewing History

1. Navigate to **History** page
2. View all generated prompts, created templates, and logged errors
3. Filter by type using the filter buttons
4. Copy any previously generated prompt

## Project Structure

```
prompt-db.dainedvorak.com/
├── api/
│   ├── templates.php      # Template CRUD operations
│   └── history.php         # History retrieval and saving
├── config/
│   └── database.php        # Database configuration
├── database/
│   └── schema.sql          # Database schema
├── js/
│   ├── home.js             # Home page functionality
│   ├── template-creator.js # Template creation logic
│   └── history.js          # History display logic
├── index.html              # Home page
├── template-creator.html   # Template creator page
├── history.html            # History page
└── README.md               # This file
```

## Database Schema

### Tables

- **prompt_templates**: Stores prompt templates
- **template_variables**: Stores variable configurations for each template
- **prompt_history**: Stores generated prompts
- **error_logs**: Stores application errors

## Technologies Used

- **Frontend**: Bootstrap 5, Vanilla JavaScript
- **Backend**: PHP 7.4+, PDO
- **Database**: MySQL
- **Icons**: Bootstrap Icons
- **CDN Resources**: Bootstrap CSS/JS from CDN

## Troubleshooting

### Database Connection Errors

- Verify MySQL is running: `sudo systemctl status mysql`
- Check credentials in `config/database.php`
- Ensure database and tables are created: `mysql -u root -p prompt_db`

### API Errors

- Check PHP error logs: `sudo tail -f /var/log/apache2/error.log`
- Verify file permissions
- Ensure PDO MySQL extension is enabled: `php -m | grep pdo_mysql`

### Page Not Loading

- Check web server is running: `sudo systemctl status apache2`
- Verify virtual host configuration
- Check browser console for JavaScript errors

## Security Considerations

- Change default database credentials
- Use prepared statements (already implemented)
- Implement user authentication for production use
- Enable HTTPS in production
- Sanitize all user inputs (basic sanitization implemented)

## Future Enhancements

- User authentication and multi-user support
- Template categories and tags
- Export/import templates
- Template sharing between users
- Advanced variable types (dropdowns, checkboxes, etc.)
- Template versioning
- Search and filter functionality

## License

This project is open source and available for personal and commercial use.

## Support

For issues or questions, please check the error logs in the History page or contact the administrator.
