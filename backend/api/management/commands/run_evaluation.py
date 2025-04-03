from django.core.management.base import BaseCommand
from django.db.models import Count
from api.recommendation_service import SocietyRecommender
from api.recommendation_evaluator import recommendation_evaluator
from api.cold_start_handler import cold_start_handler

class Command(BaseCommand):
    help = 'Run evaluation on the recommendation system'

    def add_arguments(self, parser):
        parser.add_argument(
            '--mode',
            type=str,
            default='standard',
            help='Evaluation mode: standard, cold_start, diversity, all'
        )
        parser.add_argument(
            '--k',
            type=int,
            default=5,
            help='Number of recommendations to generate'
        )

    def handle(self, *args, **options):
        mode = options['mode']
        k = options['k']
        
        self.stdout.write(f"Running recommendation system evaluation in {mode} mode with k={k}")
        
        # Initialize recommender
        recommender = SocietyRecommender()
        
        if mode == 'standard' or mode == 'all':
            self.stdout.write("\n=== Running standard evaluation ===")
            results = recommendation_evaluator.evaluate_recommender(recommender, k=k)
            self._print_results(results)
        
        if mode == 'cold_start' or mode == 'all':
            self.stdout.write("\n=== Running cold start evaluation ===")
            results = recommendation_evaluator.evaluate_cold_start(recommender, cold_start_handler, k=k)
            self._print_cold_start_results(results)
        
        if mode == 'diversity' or mode == 'all':
            self.stdout.write("\n=== Running diversity vs. relevance evaluation ===")
            results = recommendation_evaluator.evaluate_diverstity_vs_relevance(recommender, k=k)
            self._print_diversity_results(results)
        
        self.stdout.write("\nEvaluation complete. Full results are saved in the evaluation_results directory.")
    
    def _print_results(self, results):
        """Print a summary of standard evaluation results."""
        if 'error' in results:
            self.stdout.write(self.style.ERROR(f"Error: {results['error']}"))
            return
            
        self.stdout.write(f"Test users: {results.get('num_test_users', 0)}")
        
        if 'metrics' in results:
            self.stdout.write("\nMetric averages:")
            for metric, values in results['metrics'].items():
                self.stdout.write(f"  {metric}: {values.get('mean', 0):.4f}")
    
    def _print_cold_start_results(self, results):
        """Print a summary of cold start evaluation results."""
        if 'error' in results:
            self.stdout.write(self.style.ERROR(f"Error: {results['error']}"))
            return
            
        self.stdout.write(f"Test users: {results.get('num_test_users', 0)}")
        
        if 'cold_start_metrics' in results:
            self.stdout.write("\nCold Start vs. Popularity Baseline:")
            
            cs_precision = results['cold_start_metrics'].get('cold_start_precision', {}).get('mean', 0)
            pop_precision = results['cold_start_metrics'].get('popular_precision', {}).get('mean', 0)
            improvement = results['cold_start_metrics'].get('precision_improvement', {}).get('mean', 0)
            
            self.stdout.write(f"  Cold Start Precision: {cs_precision:.4f}")
            self.stdout.write(f"  Popularity Precision: {pop_precision:.4f}")
            self.stdout.write(f"  Improvement: {improvement:.4f} ({improvement*100:.1f}%)")
            
            cs_diversity = results['cold_start_metrics'].get('cold_start_diversity', {}).get('mean', 0)
            pop_diversity = results['cold_start_metrics'].get('popular_diversity', {}).get('mean', 0)
            
            self.stdout.write(f"  Cold Start Diversity: {cs_diversity:.4f}")
            self.stdout.write(f"  Popularity Diversity: {pop_diversity:.4f}")
    
    def _print_diversity_results(self, results):
        """Print a summary of diversity evaluation results."""
        if 'error' in results:
            self.stdout.write(self.style.ERROR(f"Error: {results['error']}"))
            return
            
        self.stdout.write(f"Test users: {results.get('num_test_users', 0)}")
        
        if 'aggregate_metrics' in results:
            self.stdout.write("\nDiversity Level Comparison:")
            
            for level, metrics in results['aggregate_metrics'].items():
                precision = metrics.get('precision_avg', 0)
                diversity = metrics.get('diversity_avg', 0)
                
                self.stdout.write(f"\n  {level.upper()} diversity setting:")
                self.stdout.write(f"    Precision: {precision:.4f}")
                self.stdout.write(f"    Diversity: {diversity:.4f}")