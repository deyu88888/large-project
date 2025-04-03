from django.core.management.base import BaseCommand
from django.db.models import Count, Q, Avg
from django.utils import timezone
import numpy as np
import random
import json
import os
import time
from collections import defaultdict
from datetime import datetime
from sklearn.model_selection import KFold

from api.models import Student, Society
from api.recommendation_service import SocietyRecommender
from api.cold_start_handler import cold_start_handler
from api.recommendation_evaluator import recommendation_evaluator

class Command(BaseCommand):
    help = 'Run advanced cross-validation evaluation on recommendation system'

    def add_arguments(self, parser):
        parser.add_argument(
            '--k',
            type=int,
            default=5,
            help='Number of recommendations to generate'
        )
        parser.add_argument(
            '--folds',
            type=int,
            default=5,
            help='Number of cross-validation folds'
        )
        parser.add_argument(
            '--test-only',
            action='store_true',
            help='Only use test data (prefixed with test_eval_)'
        )

    def handle(self, *args, **options):
        k = options['k']
        n_folds = options['folds']
        test_only = options['test_only']
        
        self.stdout.write(self.style.SUCCESS(
            f"Running advanced recommendation evaluation with {n_folds}-fold cross-validation (k={k})"
        ))
        
        # Get eligible students (with at least 2 society memberships)
        if test_only:
            students = Student.objects.filter(
                username__startswith='test_eval_'
            ).annotate(
                num_societies=Count('societies')
            ).filter(num_societies__gte=2)
        else:
            students = Student.objects.annotate(
                num_societies=Count('societies')
            ).filter(num_societies__gte=2)
        
        student_ids = list(students.values_list('id', flat=True))
        
        if len(student_ids) < n_folds:
            self.stdout.write(self.style.ERROR(
                f"Not enough eligible students for {n_folds}-fold cross-validation. Found {len(student_ids)} students."
            ))
            if len(student_ids) < 2:
                self.stdout.write(self.style.ERROR(
                    "Cannot run evaluation with fewer than 2 eligible students."
                ))
                return
            n_folds = len(student_ids)
            self.stdout.write(self.style.WARNING(
                f"Reducing to {n_folds}-fold cross-validation."
            ))
        
        # Shuffle student IDs for randomization
        random.shuffle(student_ids)
        
        # Initialize cross-validation
        kf = KFold(n_splits=n_folds, shuffle=True, random_state=42)
        
        # Define recommender types
        recommenders = {
            'advanced': SocietyRecommender(),
            'baseline': self._create_baseline_recommender(),
        }
        
        # Store results for each model and fold
        all_results = {
            'timestamp': datetime.now().isoformat(),
            'num_students': len(student_ids),
            'k': k,
            'n_folds': n_folds,
            'models': {},
            'folds': []
        }
        
        # Run cross-validation
        fold_idx = 0
        for train_idx, test_idx in kf.split(student_ids):
            fold_idx += 1
            self.stdout.write(f"\nEvaluating fold {fold_idx}/{n_folds}...")
            
            # Get train and test student IDs
            train_ids = [student_ids[i] for i in train_idx]
            test_ids = [student_ids[i] for i in test_idx]
            
            fold_results = {
                'fold': fold_idx,
                'num_test': len(test_ids),
                'num_train': len(train_ids),
                'models': {}
            }
            
            # Evaluate each model
            for model_name, recommender in recommenders.items():
                self.stdout.write(f"  Evaluating {model_name} recommender...")
                
                # Evaluation using holdout method for this fold
                model_results = self._evaluate_with_holdout(
                    recommender, test_ids, k
                )
                
                # Store results for this model and fold
                fold_results['models'][model_name] = model_results
                
                # Update overall model metrics
                if model_name not in all_results['models']:
                    all_results['models'][model_name] = {
                        'metrics': defaultdict(list)
                    }
                
                # Aggregate metrics across folds
                for metric, value in model_results['metrics'].items():
                    all_results['models'][model_name]['metrics'][metric].append(value['mean'])
            
            # Add fold results to overall results
            all_results['folds'].append(fold_results)
        
        # Calculate aggregate metrics across all folds
        for model_name in all_results['models']:
            metrics = all_results['models'][model_name]['metrics']
            all_results['models'][model_name]['aggregate'] = {}
            
            for metric, values in metrics.items():
                all_results['models'][model_name]['aggregate'][metric] = {
                    'mean': float(np.mean(values)),
                    'std': float(np.std(values)),
                    'min': float(np.min(values)),
                    'max': float(np.max(values))
                }
        
        # Save full results
        self._save_evaluation_results(all_results)
        
        # Display summary
        self._print_evaluation_summary(all_results)
    
    def _create_baseline_recommender(self):
        """Create a simple baseline recommender that uses popularity only"""
        class BaselineRecommender:
            def get_recommendations_for_student(self, student_id, limit=5, **kwargs):
                # Simply return most popular societies by member count
                return Society.objects.filter(
                    status="Approved"
                ).annotate(
                    member_count=Count('society_members')
                ).exclude(
                    society_members__id=student_id
                ).order_by('-member_count')[:limit]
        
        return BaselineRecommender()
    
    def _evaluate_with_holdout(self, recommender, student_ids, k):
        """
        Evaluate recommender using the holdout method.
        For each student, hold out one society and see if it gets recommended.
        """
        results = {
            'num_students': len(student_ids),
            'metrics': {},
            'per_student': {}
        }
        
        # Metrics to track
        metrics = {
            'precision': [],
            'recall': [],
            'hit_rate': [],
            'diversity': [],
            'novelty': []
        }
        
        for student_id in student_ids:
            try:
                student = Student.objects.get(id=student_id)
                
                # Get all societies the student is a member of
                all_societies = list(student.societies.all().values_list('id', flat=True))
                
                # Skip if not enough societies
                if len(all_societies) < 2:
                    continue
                
                # Hold out one random society
                holdout_id = random.choice(all_societies)
                training_ids = [sid for sid in all_societies if sid != holdout_id]
                
                # Temporarily modify student's memberships
                original_societies = student.societies.all()
                student.societies.set(Society.objects.filter(id__in=training_ids))
                
                # Get recommendations
                recommendations = recommender.get_recommendations_for_student(student_id, k)
                rec_ids = [rec.id for rec in recommendations]
                
                # Restore original memberships
                student.societies.set(original_societies)
                
                # Calculate metrics
                # 1. Precision at k (whether holdout is in recommendations)
                hit = 1 if holdout_id in rec_ids else 0
                precision = hit / len(rec_ids) if rec_ids else 0
                metrics['precision'].append(precision)
                
                # 2. Hit rate (same as precision in this case)
                metrics['hit_rate'].append(hit)
                
                # 3. Recall (always 1 or 0 since we have one holdout)
                metrics['recall'].append(hit)
                
                # 4. Diversity (category diversity in recommendations)
                categories = [rec.category for rec in recommendations if rec.category]
                diversity = len(set(categories)) / len(categories) if categories else 0
                metrics['diversity'].append(diversity)
                
                # 5. Novelty (how rarely recommended the items are)
                society_popularities = []
                for rec in recommendations:
                    count = rec.society_members.count()
                    society_popularities.append(count)
                
                # Calculate inverse popularity (higher = more novel)
                if society_popularities:
                    avg_popularity = sum(society_popularities) / len(society_popularities)
                    total_students = Student.objects.count()
                    novelty = 1 - (avg_popularity / total_students) if total_students > 0 else 0
                else:
                    novelty = 0
                    
                metrics['novelty'].append(novelty)
                
                # Store per-student results
                results['per_student'][student_id] = {
                    'holdout_id': holdout_id,
                    'recommendations': rec_ids,
                    'hit': hit,
                    'precision': precision,
                    'diversity': diversity,
                    'novelty': novelty
                }
                
            except Student.DoesNotExist:
                continue
        
        # Calculate aggregate metrics
        for metric, values in metrics.items():
            if values:
                results['metrics'][metric] = {
                    'mean': float(np.mean(values)),
                    'std': float(np.std(values)),
                    'min': float(np.min(values)),
                    'max': float(np.max(values)),
                    'count': len(values)
                }
            else:
                results['metrics'][metric] = {
                    'mean': 0,
                    'std': 0,
                    'min': 0,
                    'max': 0,
                    'count': 0
                }
        
        return results
    
    def _save_evaluation_results(self, results):
        """Save evaluation results to file"""
        results_dir = os.path.join(os.getcwd(), 'evaluation_results')
        os.makedirs(results_dir, exist_ok=True)
        
        # Create filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"cross_validation_{timestamp}.json"
        filepath = os.path.join(results_dir, filename)
        
        with open(filepath, 'w') as f:
            json.dump(results, f, indent=2)
        
        self.stdout.write(self.style.SUCCESS(f"Full evaluation results saved to {filepath}"))
    
    def _print_evaluation_summary(self, results):
        """Print a summary of evaluation results"""
        self.stdout.write("\n=== EVALUATION SUMMARY ===")
        self.stdout.write(f"Students: {results['num_students']}, K: {results['k']}, Folds: {results['n_folds']}")
        
        # Print comparisons between models
        self.stdout.write("\nMetric Comparison (mean ± std):")
        
        # Get all metrics from first model
        if results['models']:
            first_model = list(results['models'].keys())[0]
            metrics = results['models'][first_model]['aggregate'].keys()
            
            # Create comparison table
            metric_table = []
            
            for metric in metrics:
                row = [metric]
                for model_name in results['models']:
                    agg = results['models'][model_name]['aggregate']
                    if metric in agg:
                        mean = agg[metric]['mean']
                        std = agg[metric]['std']
                        row.append(f"{mean:.4f} ± {std:.4f}")
                
                metric_table.append(row)
            
            # Print table header
            header = ["Metric"] + list(results['models'].keys())
            self.stdout.write("  " + "  ".join(f"{h:<20}" for h in header))
            
            # Print table rows
            for row in metric_table:
                self.stdout.write("  " + "  ".join(f"{cell:<20}" for cell in row))
        
        self.stdout.write("\nEvaluation complete.")