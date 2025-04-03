# backend/api/recommendation_evaluator.py

import json
import time
import random
import numpy as np
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from django.db.models import Count, Q, Avg
from django.utils import timezone
from django.conf import settings
import os

import django

# Set up Django settings
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

# Now we can import models
from api.models import Society, Student, Event

class RecommendationEvaluator:
    """
    Comprehensive evaluation system for the society recommendation engine.
    Allows testing of recommendation quality, diversity, and relevance using
    real user data and simulated scenarios.
    """
    
    def __init__(self):
        # Define evaluation metrics
        self.metrics = {
            'precision': self._calculate_precision,
            'recall': self._calculate_recall,
            'diversity': self._calculate_diversity,
            'coverage': self._calculate_coverage,
            'serendipity': self._calculate_serendipity,
            'category_balance': self._calculate_category_balance
        }
        
        # Results storage path
        self.results_path = os.path.join(
            getattr(settings, 'BASE_DIR', ''), 'api', 'evaluation_results'
        )
        os.makedirs(self.results_path, exist_ok=True)
        
    def evaluate_recommender(self, recommender, test_set=None, metrics=None, k=5):
        """
        Evaluate recommender performance across multiple metrics.
        
        Args:
            recommender: SocietyRecommender instance to evaluate
            test_set: List of test student IDs (uses holdout method if None)
            metrics: List of metric names to calculate (uses all if None)
            k: Number of recommendations to generate
            
        Returns:
            Dictionary with evaluation results
        """
        if metrics is None:
            metrics = list(self.metrics.keys())
            
        if test_set is None:
            test_set = self._generate_test_set()
            
        if not test_set:
            return {"error": "No test data available"}
            
        # Track timing for performance monitoring
        start_time = time.time()
        
        results = {
            'timestamp': datetime.now().isoformat(),
            'num_test_users': len(test_set),
            'k': k,
            'metrics': {},
            'per_user_metrics': defaultdict(list)
        }
        
        # For each test user, generate recommendations and evaluate
        for student_id in test_set:
            try:
                # Get user's actual memberships for comparison
                student = Student.objects.get(id=student_id)
                
                # Create a copy of memberships for holdout evaluation
                all_societies = list(student.societies.all().values_list('id', flat=True))
                
                # If student has fewer than 2 societies, skip
                if len(all_societies) < 2:
                    continue
                    
                # Hold out one society for testing
                holdout_society = random.sample(all_societies, 1)[0]
                training_societies = set(all_societies) - {holdout_society}
                
                # Temporarily modify student's memberships for testing
                # (in a real system, we'd create a test copy of the student)
                original_societies = student.societies.all()
                student.societies.set(Society.objects.filter(id__in=training_societies))
                
                # Generate recommendations
                recommendations = recommender.get_recommendations_for_student(student_id, k)
                recommended_ids = [rec.id for rec in recommendations]
                
                # Restore original memberships
                student.societies.set(original_societies)
                
                # Calculate metrics for this user
                user_metrics = {}
                for metric_name in metrics:
                    if metric_name in self.metrics:
                        user_metrics[metric_name] = self.metrics[metric_name](
                            recommended_ids, 
                            [holdout_society],
                            student_id,
                            recommendations
                        )
                        results['per_user_metrics'][metric_name].append(user_metrics[metric_name])
                
                # Store per-user results
                results[f'user_{student_id}'] = {
                    'holdout_society': holdout_society,
                    'recommended_ids': recommended_ids,
                    'metrics': user_metrics
                }
                
            except Student.DoesNotExist:
                continue
                
        # Calculate aggregate metrics
        for metric_name in metrics:
            if metric_name in results['per_user_metrics']:
                metric_values = results['per_user_metrics'][metric_name]
                if metric_values:
                    results['metrics'][metric_name] = {
                        'mean': np.mean(metric_values),
                        'median': np.median(metric_values),
                        'min': min(metric_values),
                        'max': max(metric_values),
                        'std': np.std(metric_values)
                    }
        
        # Add execution time
        results['execution_time'] = time.time() - start_time
        
        # Save results
        self._save_evaluation_results(results)
        
        return results
    
    def evaluate_cold_start(self, recommender, cold_start_handler, k=5):
        """
        Evaluate cold start recommendations using a similarity-based approach.
        
        Args:
            recommender: SocietyRecommender instance
            cold_start_handler: ColdStartHandler instance
            k: Number of recommendations to generate
            
        Returns:
            Dictionary with cold start evaluation results
        """
        # Find users with at least 3 society memberships
        experienced_users = Student.objects.annotate(
            num_societies=Count('societies')
        ).filter(num_societies__gte=3)
        
        if not experienced_users.exists():
            return {"error": "No users with sufficient society memberships for evaluation"}
            
        # Sample users for evaluation (max 50)
        test_users = list(experienced_users[:50])
        
        results = {
            'timestamp': datetime.now().isoformat(),
            'num_test_users': len(test_users),
            'k': k,
            'cold_start_metrics': {},
            'per_user_metrics': defaultdict(list)
        }
        
        for student in test_users:
            # Get the user's actual memberships
            actual_societies = set(student.societies.all().values_list('id', flat=True))
            
            # Create a simulated cold start user with the same major but no memberships
            original_societies = student.societies.all()
            student.societies.clear()
            
            # Generate cold start recommendations
            cold_start_recs = cold_start_handler.get_initial_recommendations(student.id, k)
            cold_start_ids = [rec.id for rec in cold_start_recs]
            
            # Generate popularity-based recommendations for comparison
            popular_recs = recommender.get_popular_societies(k)
            popular_ids = [rec.id for rec in popular_recs]
            
            # Restore original memberships
            student.societies.set(original_societies)
            
            # Evaluate cold start recommendations
            cold_precision = len(set(cold_start_ids) & actual_societies) / len(cold_start_ids) if cold_start_ids else 0
            popular_precision = len(set(popular_ids) & actual_societies) / len(popular_ids) if popular_ids else 0
            
            # Calculate improvement over popularity baseline
            precision_improvement = cold_precision - popular_precision
            
            # Calculate diversity metrics
            cold_diversity = self._calculate_diversity(cold_start_ids, [], student.id, cold_start_recs)
            popular_diversity = self._calculate_diversity(popular_ids, [], student.id, popular_recs)
            
            # Store metrics
            user_results = {
                'cold_start_precision': cold_precision,
                'popular_precision': popular_precision,
                'precision_improvement': precision_improvement,
                'cold_start_diversity': cold_diversity,
                'popular_diversity': popular_diversity
            }
            
            # Add to aggregate metrics
            for metric, value in user_results.items():
                results['per_user_metrics'][metric].append(value)
            
            # Store per-user results
            results[f'user_{student.id}'] = {
                'actual_societies': list(actual_societies),
                'cold_start_recommendations': cold_start_ids,
                'popular_recommendations': popular_ids,
                'metrics': user_results
            }
        
        # Calculate aggregate metrics
        for metric_name in results['per_user_metrics']:
            metric_values = results['per_user_metrics'][metric_name]
            if metric_values:
                results['cold_start_metrics'][metric_name] = {
                    'mean': np.mean(metric_values),
                    'median': np.median(metric_values),
                    'min': min(metric_values),
                    'max': max(metric_values),
                    'std': np.std(metric_values)
                }
        
        # Save results
        self._save_evaluation_results(results, "cold_start_evaluation")
        
        return results
    
    def evaluate_diverstity_vs_relevance(self, recommender, test_set=None, k=5):
        """
        Evaluate the tradeoff between diversity and relevance with different
        diversity settings.
        
        Args:
            recommender: SocietyRecommender instance
            test_set: List of test student IDs
            k: Number of recommendations to generate
            
        Returns:
            Dictionary with diversity-relevance tradeoff results
        """
        if test_set is None:
            test_set = self._generate_test_set(min_societies=3, max_users=30)
            
        if not test_set:
            return {"error": "No test data available"}
            
        # Diversity levels to test
        diversity_levels = ['low', 'balanced', 'high']
        
        results = {
            'timestamp': datetime.now().isoformat(),
            'num_test_users': len(test_set),
            'k': k,
            'diversity_levels': diversity_levels,
            'aggregate_metrics': {},
            'per_user_results': {}
        }
        
        # For each test user, generate recommendations with different diversity settings
        for student_id in test_set:
            try:
                student = Student.objects.get(id=student_id)
                
                # Get user's actual interests (all societies except one for holdout)
                all_societies = set(student.societies.all().values_list('id', flat=True))
                
                # Skip if insufficient data
                if len(all_societies) < 3:
                    continue
                    
                # Hold out one random society
                holdout = random.sample(all_societies, 1)[0]
                training_societies = all_societies - {holdout}
                
                # Temporarily modify student's memberships
                original_societies = student.societies.all()
                student.societies.set(Society.objects.filter(id__in=training_societies))
                
                # Test each diversity level
                user_results = {}
                for level in diversity_levels:
                    # Generate recommendations with this diversity level
                    recommendations = recommender.get_recommendations_for_student(
                        student_id, k, diversity_level=level
                    )
                    rec_ids = [rec.id for rec in recommendations]
                    
                    # Calculate metrics
                    precision = self._calculate_precision(rec_ids, [holdout], student_id, recommendations)
                    diversity = self._calculate_diversity(rec_ids, [], student_id, recommendations)
                    
                    # Calculate category distribution
                    category_counts = Counter(rec.category for rec in recommendations if rec.category)
                    
                    user_results[level] = {
                        'recommendation_ids': rec_ids,
                        'precision': precision,
                        'diversity': diversity,
                        'category_distribution': dict(category_counts)
                    }
                    
                    # Add to aggregate metrics
                    if level not in results['aggregate_metrics']:
                        results['aggregate_metrics'][level] = {
                            'precision': [],
                            'diversity': []
                        }
                    
                    results['aggregate_metrics'][level]['precision'].append(precision)
                    results['aggregate_metrics'][level]['diversity'].append(diversity)
                
                # Restore original memberships
                student.societies.set(original_societies)
                
                # Store per-user results
                results['per_user_results'][student_id] = user_results
                
            except Student.DoesNotExist:
                continue
        
        # Calculate averages for aggregate metrics
        for level in diversity_levels:
            if level in results['aggregate_metrics']:
                for metric in results['aggregate_metrics'][level]:
                    values = results['aggregate_metrics'][level][metric]
                    if values:
                        results['aggregate_metrics'][level][f'{metric}_avg'] = np.mean(values)
                        results['aggregate_metrics'][level][f'{metric}_std'] = np.std(values)
        
        # Save results
        self._save_evaluation_results(results, "diversity_tradeoff_evaluation")
        
        return results
    
    def _generate_test_set(self, min_societies=2, max_users=50):
        """
        Generate a test set of users for evaluation.
        
        Args:
            min_societies: Minimum number of society memberships required
            max_users: Maximum number of users to include
            
        Returns:
            List of student IDs
        """
        # Find students with at least min_societies memberships
        eligible_students = Student.objects.annotate(
            num_societies=Count('societies')
        ).filter(num_societies__gte=min_societies)
        
        if not eligible_students.exists():
            return []
            
        # Random sample of eligible students
        test_set = list(eligible_students.values_list('id', flat=True)[:max_users])
        random.shuffle(test_set)
        
        return test_set
    
    def _calculate_precision(self, recommended_ids, relevant_ids, student_id, recommendations):
        """
        Calculate precision (how many recommended items are relevant).
        
        Args:
            recommended_ids: List of recommended society IDs
            relevant_ids: List of relevant (holdout) society IDs
            student_id: ID of the student
            recommendations: List of recommendation objects (for additional metrics)
            
        Returns:
            Precision score (0-1)
        """
        if not recommended_ids:
            return 0
            
        # Count how many of the recommended items are in the relevant set
        hits = len(set(recommended_ids) & set(relevant_ids))
        precision = hits / len(recommended_ids)
        
        return precision
    
    def _calculate_recall(self, recommended_ids, relevant_ids, student_id, recommendations):
        """
        Calculate recall (how many relevant items were recommended).
        
        Args:
            recommended_ids: List of recommended society IDs
            relevant_ids: List of relevant (holdout) society IDs
            student_id: ID of the student
            recommendations: List of recommendation objects (for additional metrics)
            
        Returns:
            Recall score (0-1)
        """
        if not relevant_ids:
            return 0
            
        # Count how many of the relevant items are in the recommended set
        hits = len(set(recommended_ids) & set(relevant_ids))
        recall = hits / len(relevant_ids)
        
        return recall
    
    def _calculate_diversity(self, recommended_ids, relevant_ids, student_id, recommendations):
        """
        Calculate diversity of recommendations based on category distribution.
        
        Args:
            recommended_ids: List of recommended society IDs
            relevant_ids: List of relevant society IDs (unused)
            student_id: ID of the student (unused)
            recommendations: List of recommendation objects
            
        Returns:
            Diversity score (0-1) where 1 is maximally diverse
        """
        if not recommendations:
            return 0
            
        # Count categories
        categories = [rec.category for rec in recommendations if rec.category]
        
        if not categories:
            return 0
            
        # Calculate category entropy
        category_counts = Counter(categories)
        total = len(categories)
        
        entropy = 0
        for count in category_counts.values():
            p = count / total
            entropy -= p * np.log2(p) if p > 0 else 0
            
        # Normalize by maximum possible entropy (when all categories are equally represented)
        max_entropy = np.log2(len(category_counts)) if len(category_counts) > 0 else 0
        
        if max_entropy == 0:
            return 0
            
        normalized_entropy = entropy / max_entropy
        
        return normalized_entropy
    
    def _calculate_coverage(self, recommended_ids, relevant_ids, student_id, recommendations):
        """
        Calculate catalog coverage (percentage of all societies that get recommended).
        This is an aggregate metric that should be calculated across many users.
        
        For individual evaluation, we approximate by measuring how many "rare" societies
        are included in the recommendations.
        
        Args:
            recommended_ids: List of recommended society IDs
            relevant_ids: List of relevant society IDs (unused)
            student_id: ID of the student (unused)
            recommendations: List of recommendation objects
            
        Returns:
            Coverage score (0-1)
        """
        if not recommendations:
            return 0
            
        # Get a measure of how "popular" each society is
        society_popularities = {}
        for society in recommendations:
            member_count = getattr(society, 'total_members', 0)
            if not member_count and hasattr(society, 'society_members'):
                member_count = society.society_members.count()
            society_popularities[society.id] = member_count
            
        # Calculate inverse popularity (higher for rarer societies)
        total_societies = Society.objects.filter(status="Approved").count()
        avg_popularity = Society.objects.filter(status="Approved").annotate(
            member_count=Count('society_members')
        ).aggregate(avg=Avg('member_count'))['avg'] or 1
        
        # Normalize popularities relative to average
        normalized_rarity = 0
        for society_id, popularity in society_popularities.items():
            # Higher score for less popular societies
            if popularity > 0:
                rarity = avg_popularity / popularity
                normalized_rarity += min(rarity, 3)  # Cap at 3x the average
            else:
                normalized_rarity += 3  # Maximum rarity for societies with no members
        
        # Normalize by number of recommendations
        if len(recommendations) > 0:
            normalized_rarity /= len(recommendations)
            
        # Scale to 0-1 range where higher is better coverage
        coverage_score = min(normalized_rarity / 3, 1.0)
        
        return coverage_score
    
    def _calculate_serendipity(self, recommended_ids, relevant_ids, student_id, recommendations):
        """
        Calculate serendipity (how surprising yet relevant the recommendations are).
        
        Args:
            recommended_ids: List of recommended society IDs
            relevant_ids: List of relevant society IDs
            student_id: ID of the student
            recommendations: List of recommendation objects
            
        Returns:
            Serendipity score (0-1)
        """
        try:
            student = Student.objects.get(id=student_id)
            
            # Get categories the student is already interested in
            user_categories = set(student.societies.values_list('category', flat=True))
            
            # Calculate unexpectedness (higher for recommendations in new categories)
            unexpectedness = 0
            for rec in recommendations:
                if rec.category and rec.category not in user_categories:
                    unexpectedness += 1
            
            if not recommendations:
                return 0
                
            # Normalize by number of recommendations
            unexpectedness = unexpectedness / len(recommendations)
            
            # Combine with relevance (is the holdout item recommended?)
            relevance = self._calculate_precision(recommended_ids, relevant_ids, student_id, recommendations)
            
            # Serendipity = unexpectedness * relevance
            serendipity = unexpectedness * relevance
            
            return serendipity
            
        except Student.DoesNotExist:
            return 0
    
    def _calculate_category_balance(self, recommended_ids, relevant_ids, student_id, recommendations):
        """
        Calculate how well recommendations are balanced across categories.
        
        Args:
            recommended_ids: List of recommended society IDs
            relevant_ids: List of relevant society IDs (unused)
            student_id: ID of the student
            recommendations: List of recommendation objects
            
        Returns:
            Category balance score (0-1)
        """
        if not recommendations:
            return 0
            
        # Get student's existing category distribution
        try:
            student = Student.objects.get(id=student_id)
            user_category_counts = Counter(student.societies.values_list('category', flat=True))
            
            # Get recommendation category distribution
            rec_category_counts = Counter(rec.category for rec in recommendations if rec.category)
            
            # If student has no societies or recommendations have no categories
            if not user_category_counts or not rec_category_counts:
                return 0
                
            # Calculate similarity between distributions
            categories = set(user_category_counts.keys()) | set(rec_category_counts.keys())
            
            # Normalize counts to distributions
            user_total = sum(user_category_counts.values())
            rec_total = sum(rec_category_counts.values())
            
            user_dist = {cat: user_category_counts.get(cat, 0) / user_total for cat in categories}
            rec_dist = {cat: rec_category_counts.get(cat, 0) / rec_total for cat in categories}
            
            # Calculate balance score (1 - Jensen-Shannon divergence)
            # First, calculate KL divergence
            kl_sum = 0
            for cat in categories:
                p = user_dist.get(cat, 0)
                q = rec_dist.get(cat, 0)
                # Avoid division by zero
                if p > 0 and q > 0:
                    kl_sum += p * np.log2(p / q)
            
            # JS divergence is bounded between 0 and 1
            js_divergence = min(1, kl_sum / 2)
            
            # Balance score = 1 - divergence (higher is better)
            balance_score = 1 - js_divergence
            
            return balance_score
            
        except Student.DoesNotExist:
            return 0
    
    def _save_evaluation_results(self, results, prefix="evaluation"):
        """Save evaluation results to file."""
        try:
            # Create filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{prefix}_{timestamp}.json"
            filepath = os.path.join(self.results_path, filename)
            
            with open(filepath, 'w') as f:
                json.dump(results, f, indent=2)  
        except Exception as e:
            pass

# Create a singleton instance for reuse
recommendation_evaluator = RecommendationEvaluator()