## Laravel Setup

### 1. Install PHP or Virtual Server
- **Option 1:** Install PHP directly on your machine.
- **Option 2:** Install a virtual server like [XAMPP](https://www.apachefriends.org/) or [Laragon](https://laragon.org/).
- PHP version 8.2 (php version must related on HostAtom) 

### 2. Enable `pdo_mysql` in PHP Extension
- Locate the `php.ini` file. For example, in Laragon, it might be located at `C:\laragon\bin\php\php-8.2.27-Win32-vs16-x64\`.
- Open the `php.ini` file.
- Search for `extension=pdo_mysql`.
- Remove the semicolon (`;`) at the beginning of the line to uncomment it.
- Save the file.

### 3. Configure Environment Variables
- Add a new path in the **System Variables**.
- Copy the PHP location path. For example, `C:\laragon\bin\php\php-8.2.27-Win32-vs16-x64\`.

### 4. Install Composer
- Download and install Composer from the [official website](https://getcomposer.org/).
- Composer is a dependency manager for PHP and is essential for Laravel projects.

## Running a Laravel Project

### 1. Clone the Laravel Project
- Clone your Laravel project from a repository (e.g., GitHub) using Git:
  ```bash
  git clone https://github.com/bon-nop/tnp-backend.git

### 2. Navigate to the Project Directory
- Move into the project directory: `cd your-laravel-project`

### 3. Install Dependencies
- Install the project dependencies using Composer: `composer install`

### 4. Create .env File
- Copy the .env.example file to create a new .env file: `cp .env.example .env`

### 5. Generate Application Key
- Generate a new application key: `php artisan key:generate`

### 6. Configure Database
- Open the .env file and configure your database settings:
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database_name
DB_USERNAME=your_database_username
DB_PASSWORD=your_database_password
```

### 7. Run Migrations
- Run the database migrations to set up the database schema: `php artisan migrate`

### 8. Start the Development Server
- Start the Laravel development server: `php artisan serve`

## Debug on Visual Studio Code (vs code)
1. Download php_xdbug.dll from [xdebug.org/wizard](https://xdebug.org/wizard)
2. Config ***php.ini*** file.
```
uncomment
extension=curl
extension=fileinfo
extension=mbstring
extension=openssl
extension=pdo_mysql

add to bottom file 
[xdebug]
xdebug.mode=debug
xdebug.start_with_request=yes
xdebug.discover_client_host=yes
xdebug.client_port=9001
xdebug.remote_port=9001
xdebug.idekey = VSCODE
xdebug.log_level=0
xdebug.remote_enable=1
xdebug.remote_autostart=1
xdebug.client_host="127.0.0.1"
zend_extension=xdebug
```
3. Install PHP Debug (Xdebug) extension on vscode.
4. Setting extension PHP Debug 
```
//setting.json
"php.debug.executablePath": "C:/laragon/bin/php/php-8.2.27-Win32-vs16-x64/",
"php.debug.ideKey": "VSCODE"
```
5. Config ***lunch.json*** file.
```
{
   "name": "Listen for Xdebug",
   "type": "php",
   "request": "launch",
   "port": 9001,
}
```
6. Config Fpdf Library for worksheet. 
```
//Fpdf.php
Location: "vendor/codedge/laravel-fpdf/src/Fpdf/"
in line 150 change "$margin = 28.35/$this->k" to "$margin = 6.35/$this->k"
```
<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework.

You may also try the [Laravel Bootcamp](https://bootcamp.laravel.com), where you will be guided through building a modern Laravel application from scratch.

If you don't feel like reading, [Laracasts](https://laracasts.com) can help. Laracasts contains over 2000 video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

## Laravel Sponsors

We would like to extend our thanks to the following sponsors for funding Laravel development. If you are interested in becoming a sponsor, please visit the Laravel [Patreon page](https://patreon.com/taylorotwell).

### Premium Partners

- **[Vehikl](https://vehikl.com/)**
- **[Tighten Co.](https://tighten.co)**
- **[Kirschbaum Development Group](https://kirschbaumdevelopment.com)**
- **[64 Robots](https://64robots.com)**
- **[Cubet Techno Labs](https://cubettech.com)**
- **[Cyber-Duck](https://cyber-duck.co.uk)**
- **[Many](https://www.many.co.uk)**
- **[Webdock, Fast VPS Hosting](https://www.webdock.io/en)**
- **[DevSquad](https://devsquad.com)**
- **[Curotec](https://www.curotec.com/services/technologies/laravel/)**
- **[OP.GG](https://op.gg)**
- **[WebReinvent](https://webreinvent.com/?utm_source=laravel&utm_medium=github&utm_campaign=patreon-sponsors)**
- **[Lendio](https://lendio.com)**

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
