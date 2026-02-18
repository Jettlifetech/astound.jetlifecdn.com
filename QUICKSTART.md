# Quick Start Guide - Prompt Template Manager

## 🚀 Getting Started in 5 Minutes

### Step 1: Configure Database
Edit `config/database.php` and update your MySQL credentials:

```php
define('DB_USER', 'jltremoteroot');
define('DB_PASS', 'DuiES#aowbfPgRD');
```

### Step 2: Run Setup
Open your browser and navigate to:
```
http://your-domain/setup.php
```

This will automatically:
- Check system requirements
- Create the database
- Create all necessary tables
- Verify the installation

**Important**: Delete `setup.php` after successful setup!

### Step 3: Start Creating Templates

#### Create Your First Template:
1. Go to **Create Template** page
2. Enter template name: "Email Writer"
3. Enter prompt text:
   ```
   Write a [tone] email to [recipient] about [subject]. 
   The email should be approximately [length] words.
   ```
4. Click **Parse Variables**
5. Configure the variables:
   - **tone**: Label = "Email Tone", Type = Text
   - **recipient**: Label = "Recipient Name", Type = Text
   - **subject**: Label = "Email Subject", Type = Text
   - **length**: Label = "Word Count", Type = Number
6. Click **Save Template**

#### Generate Your First Prompt:
1. Go to **Home** page
2. Select "Email Writer" template
3. Fill in the form:
   - Email Tone: "professional"
   - Recipient Name: "John Smith"
   - Email Subject: "quarterly report"
   - Word Count: "200"
4. Click **Generate Prompt**
5. Copy the generated prompt!

### Step 4: View History
Navigate to **History** page to see:
- All generated prompts
- Created templates
- Any errors (for debugging)

## 📋 Template Variable Format

Variables must be wrapped in square brackets: `[variable-name]`

**Examples:**
- `[name]` - Simple variable
- `[email-address]` - Variable with hyphen
- `[user_id]` - Variable with underscore

## 🎨 Available Input Types

When configuring variables, you can choose:
- **Text**: Single-line text input
- **Text Area**: Multi-line text input
- **Number**: Numeric input
- **Date**: Date picker
- **Email**: Email validation
- **URL**: URL validation

## 📁 Project Structure

```
prompt-db.dainedvorak.com/
├── index.html              ← Home page (generate prompts)
├── template-creator.html   ← Create templates
├── history.html            ← View history
├── setup.php              ← Initial setup (delete after use)
├── .htaccess              ← Apache configuration
├── README.md              ← Full documentation
├── QUICKSTART.md          ← This file
│
├── api/
│   ├── templates.php      ← Template API
│   └── history.php        ← History API
│
├── config/
│   └── database.php       ← Database configuration
│
├── database/
│   └── schema.sql         ← Database schema
│
└── js/
    ├── home.js            ← Home page logic
    ├── template-creator.js ← Template creation logic
    └── history.js         ← History display logic
```

## 🔧 Common Issues & Solutions

### Database Connection Error
```bash
# Check MySQL is running
sudo systemctl status mysql

# Verify credentials
mysql -u your_username -p
```

### Permission Issues
```bash
# Fix file permissions
sudo chown -R www-data:www-data /var/www/prompt-db.dainedvorak.com/
sudo chmod -R 755 /var/www/prompt-db.dainedvorak.com/
```

### API Not Working
```bash
# Check PHP error log
sudo tail -f /var/log/apache2/error.log

# Verify mod_rewrite is enabled
sudo a2enmod rewrite
sudo systemctl restart apache2
```

## 💡 Usage Tips

1. **Variable Naming**: Use descriptive names like `[customer-name]` instead of `[x]`
2. **Test Templates**: Generate a test prompt after creating each template
3. **Check History**: Use the History page to review and reuse previous prompts
4. **Input Types**: Choose appropriate input types for better UX (e.g., `date` for dates)
5. **Variable Labels**: Make labels clear and user-friendly

## 🎯 Example Templates

### Story Generator
```
Write a [genre] story about [protagonist] who must [challenge]. 
The story should be set in [setting] and have a [tone] tone. 
Target length: [word-count] words.
```

Variables:
- genre → Genre (Text)
- protagonist → Main Character (Text)
- challenge → Main Challenge (Text Area)
- setting → Story Setting (Text)
- tone → Story Tone (Text)
- word-count → Word Count (Number)

### Blog Post Creator
```
Create a blog post about [topic] for [target-audience]. 
The post should have a [tone] tone and include [key-points]. 
SEO keywords: [seo-keywords]
Publication date: [pub-date]
```

Variables:
- topic → Blog Topic (Text)
- target-audience → Target Audience (Text)
- tone → Writing Tone (Text)
- key-points → Key Points to Cover (Text Area)
- seo-keywords → SEO Keywords (Text)
- pub-date → Publication Date (Date)

### Code Documentation
```
Generate documentation for a [language] function named [function-name].
Purpose: [purpose]
Parameters: [parameters]
Returns: [returns]
Example usage: [example]
```

Variables:
- language → Programming Language (Text)
- function-name → Function Name (Text)
- purpose → Function Purpose (Text Area)
- parameters → Parameters Description (Text Area)
- returns → Return Value (Text)
- example → Usage Example (Text Area)

## 🔐 Security Notes

For production use:
1. Delete `setup.php` after installation
2. Change database credentials from defaults
3. Enable HTTPS
4. Implement user authentication
5. Keep PHP and MySQL updated
6. Regular backups of the database

## 📞 Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Create more complex templates with multiple variables
- Explore the History page to track your prompts
- Share templates with your team

Enjoy using Prompt Template Manager! 🎉
