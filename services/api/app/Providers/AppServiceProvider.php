<?php

namespace App\Providers;

use App\Concerns\CompanionMockDataHandler;
use App\Factories\RecommendationActionTypesFactory;
use App\GraphQL\Resolvers\CamelCaseFieldResolver;
use App\Models\Agenda;
use App\Models\Category;
use App\Models\Checklist;
use App\Models\CsvDataSource;
use App\Models\DocDataSource;
use App\Models\DocxDataSource;
use App\Models\HtmlDataSource;
use App\Models\JpegDataSource;
use App\Models\Label;
use App\Models\LiveUpload;
use App\Models\MarkdownDataSource;
use App\Models\MP4DataSource;
use App\Models\Organization;
use App\Models\OrganizationUser;
use App\Models\PdfDataSource;
use App\Models\PngDataSource;
use App\Models\PptDataSource;
use App\Models\PptxDataSource;
use App\Models\RtfDataSource;
use App\Models\Setting;
use App\Models\TextDataSource;
use App\Models\XlsDataSource;
use App\Models\XlsxDataSource;
use App\Observers\AgendaObserver;
use App\Observers\CategoryObserver;
use App\Observers\ChecklistObserver;
use App\Observers\DataSourceObserver;
use App\Observers\LabelObserver;
use App\Observers\LiveUploadObserver;
use App\Observers\OrganizationObserver;
use App\Observers\OrganizationUserObserver;
use App\Observers\SettingObserver;
use App\Observers\VideoDataSourceObserver;
use App\Observers\XLSDataSourceObserver;
use App\Services\NotificationService;
use App\Services\Seeders\GettingStartedSeeder;
use GraphQL\Executor\Executor;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    use CompanionMockDataHandler;

    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(NotificationService::class, function ($app) {
            return new NotificationService();
        });
        $this->app->singleton(GettingStartedSeeder::class, function ($app) {
            return new GettingStartedSeeder();
        });
        $this->app->singleton('recommendation.action.factory', function () {
            return new RecommendationActionTypesFactory();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Carbon::macro('userTimezone', function () {
            $user = Auth::user();
            if ($user && $user->timezone) {
                return $this->tz($user->timezone);
            }

            return $this;
        });

        Carbon::macro('jst', function () {
            return $this->tz(config('app.timezone_jst'));
        });

        Str::macro('sanitize', function ($value, $allowableTags = null) {
            return strip_tags($value, $allowableTags);
        });

        // Set our own GraphQL default field resolver to handle camelCase → snake_case translation.
        Executor::setDefaultFieldResolver([
            CamelCaseFieldResolver::class,
            'camelCaseFieldResolver',
        ]);

        // These are common data source observations:
        CsvDataSource::observe(DataSourceObserver::class);
        DocDataSource::observe(DataSourceObserver::class);
        DocxDataSource::observe(DataSourceObserver::class);
        HtmlDataSource::observe(DataSourceObserver::class);
        MarkdownDataSource::observe(DataSourceObserver::class);
        PdfDataSource::observe(DataSourceObserver::class);
        PptDataSource::observe(DataSourceObserver::class);
        PptxDataSource::observe(DataSourceObserver::class);
        TextDataSource::observe(DataSourceObserver::class);
        RtfDataSource::observe(DataSourceObserver::class);
        XlsDataSource::observe(XLSDataSourceObserver::class);
        XlsxDataSource::observe(XLSDataSourceObserver::class);
        MP4DataSource::observe(VideoDataSourceObserver::class);
        JpegDataSource::observe(DataSourceObserver::class);
        PngDataSource::observe(DataSourceObserver::class);
        Organization::observe(OrganizationObserver::class);
        LiveUpload::observe(LiveUploadObserver::class);
        Agenda::observe(AgendaObserver::class);
        Checklist::observe(ChecklistObserver::class);

        // Cache invalidation observers
        // Note: User, Pulse, and PulseMember use #[ObservedBy] attribute on the model class
        OrganizationUser::observe(OrganizationUserObserver::class);
        Label::observe(LabelObserver::class);
        Setting::observe(SettingObserver::class);
        Category::observe(CategoryObserver::class);
    }
}
