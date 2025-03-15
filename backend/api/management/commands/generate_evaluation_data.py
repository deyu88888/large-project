# backend/api/management/commands/generate_evaluation_data.py

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model
from api.models import Society, Student, Event
import random
import datetime
import string
import numpy as np

class Command(BaseCommand):
    help = 'Generate synthetic test data for rigorous recommendation evaluation'

    def add_arguments(self, parser):
        parser.add_argument(
            '--students',
            type=int,
            default=50,
            help='Number of test students to generate'
        )
        parser.add_argument(
            '--societies',
            type=int,
            default=20,
            help='Number of test societies to generate'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing test data before generating new data'
        )

    def handle(self, *args, **options):
        num_students = options['students']
        num_societies = options['societies']
        clear_existing = options['clear']
        
        # Set random seed for reproducibility
        random.seed(42)
        np.random.seed(42)
        
        if clear_existing:
            self._clear_test_data()
        
        # Create test societies with realistic distributions
        self._create_test_societies(num_societies)
        
        # Create test students with correlated interests
        self._create_test_students(num_students)
        
        # Generate realistic membership patterns
        self._generate_memberships()
        
        self.stdout.write(self.style.SUCCESS(
            f"Successfully created evaluation dataset with {num_students} students and {num_societies} societies."
        ))
    
    def _clear_test_data(self):
        """Clear existing test data"""
        Student.objects.filter(username__startswith='test_eval_').delete()
        Society.objects.filter(name__startswith='TestSoc_').delete()
        self.stdout.write("Cleared existing test data.")
    
    def _create_test_societies(self, count):
        """Create test societies with realistic distributions"""
        # Define society categories with realistic distribution
        categories = [
            ('Academic', 0.2),
            ('Sports', 0.25),
            ('Arts', 0.15),
            ('Technology', 0.15),
            ('Social', 0.1),
            ('Cultural', 0.1),
            ('Gaming', 0.05)
        ]
        
        # Create category distribution
        category_dist = []
        for cat, prob in categories:
            category_dist.extend([cat] * int(prob * 100))
        
        # Generate common tags for each category
        category_tags = {
            'Academic': ['study', 'research', 'learning', 'academic', 'knowledge'],
            'Sports': ['fitness', 'competition', 'team', 'athletic', 'health'],
            'Arts': ['creative', 'performance', 'expression', 'artistic', 'visual'],
            'Technology': ['coding', 'innovation', 'digital', 'programming', 'tech'],
            'Social': ['community', 'networking', 'friendship', 'social', 'events'],
            'Cultural': ['heritage', 'diversity', 'culture', 'international', 'tradition'],
            'Gaming': ['games', 'esports', 'competitive', 'strategy', 'fun']
        }
        
        # Standard description templates
        descriptions = [
            "A {adj} community dedicated to bringing like-minded individuals together through {activity} around {topic}.",
            "We are a {adj} society focused on {topic}. We organize regular {activity} for members.",
            "Join our {adj} group of students passionate about {topic}. We host {activity} throughout the year.",
            "The premier {category} society at our university. We specialize in {topic} and offer {activity}.",
            "A welcoming society for everyone interested in {topic}. Our {activity} are designed to be {adj}."
        ]
        
        activities = [
            "workshops and training sessions",
            "competitions and tournaments",
            "social events and gatherings",
            "discussions and debates",
            "collaborative projects",
            "exhibitions and showcases"
        ]
        
        adjectives = [
            "vibrant", "dynamic", "inclusive", "engaging", "supportive", 
            "innovative", "active", "friendly", "diverse", "passionate"
        ]
        
        societies_created = 0
        
        with transaction.atomic():
            for i in range(count):
                # Select category with weighted probability
                category = random.choice(category_dist)
                
                # Generate tags (some from category, some random)
                category_specific_tags = random.sample(category_tags[category], 
                                                    k=random.randint(1, 3))
                
                # Create common tags across categories to create realistic correlations
                common_tags = []
                if random.random() < 0.3:  # 30% chance of having common tags
                    other_category = random.choice([c for c, _ in categories if c != category])
                    common_tags = random.sample(category_tags[other_category], 
                                              k=random.randint(1, 2))
                
                all_tags = category_specific_tags + common_tags
                
                # Generate society description
                template = random.choice(descriptions)
                activity = random.choice(activities)
                adj = random.choice(adjectives)
                topic = random.choice(category_tags[category])
                
                description = template.format(
                    category=category.lower(),
                    topic=topic,
                    activity=activity,
                    adj=adj
                )
                
                # Create the society
                society = Society.objects.create(
                    name=f"TestSoc_{i}_{category}",
                    description=description,
                    category=category,
                    status="Approved",
                    tags=all_tags
                )
                
                societies_created += 1
                if societies_created % 10 == 0:
                    self.stdout.write(f"Created {societies_created} test societies...")
        
        self.stdout.write(f"Created {societies_created} test societies with realistic categories and tags.")
    
    def _create_test_students(self, count):
        """Create test students with varied attributes"""
        # Define possible majors with realistic distribution
        majors = [
            ('Computer Science', 0.15),
            ('Engineering', 0.15),
            ('Business', 0.15),
            ('Arts', 0.1),
            ('Sciences', 0.1),
            ('Humanities', 0.1),
            ('Medicine', 0.05),
            ('Law', 0.05),
            ('Education', 0.05),
            ('Other', 0.1)
        ]
        
        # Create major distribution
        major_dist = []
        for major, prob in majors:
            major_dist.extend([major] * int(prob * 100))
        
        students_created = 0
        
        with transaction.atomic():
            for i in range(count):
                # Select major with weighted probability
                major = random.choice(major_dist)
                
                # Create the student
                student = Student.objects.create(
                    username=f"test_eval_{i}",
                    email=f"test_eval_{i}@example.com",
                    first_name=f"Test{i}",
                    last_name=f"Student{i}",
                    major=major,
                    status="Approved"
                )
                
                students_created += 1
                if students_created % 10 == 0:
                    self.stdout.write(f"Created {students_created} test students...")
        
        self.stdout.write(f"Created {students_created} test students with realistic majors.")
    
    def _generate_memberships(self):
        """Generate realistic membership patterns between students and societies"""
        # Get all test students and societies
        students = Student.objects.filter(username__startswith='test_eval_')
        societies = Society.objects.filter(name__startswith='TestSoc_')
        
        if not students or not societies:
            self.stdout.write(self.style.ERROR("No test students or societies found."))
            return
        
        # Create realistic membership patterns
        # Students tend to join societies in related categories
        
        with transaction.atomic():
            # Get category relationships for more realistic connections
            category_affinities = {
                'Academic': ['Technology', 'Social'],
                'Sports': ['Social', 'Academic'],
                'Arts': ['Cultural', 'Social'],
                'Technology': ['Academic', 'Gaming'],
                'Social': ['Cultural', 'Arts', 'Sports'],
                'Cultural': ['Arts', 'Social'],
                'Gaming': ['Technology', 'Social']
            }
            
            # Major to category affinities
            major_affinities = {
                'Computer Science': ['Technology', 'Gaming', 'Academic'],
                'Engineering': ['Technology', 'Academic', 'Sports'],
                'Business': ['Social', 'Academic'],
                'Arts': ['Arts', 'Cultural'],
                'Sciences': ['Academic', 'Technology'],
                'Humanities': ['Cultural', 'Social', 'Arts'],
                'Medicine': ['Academic', 'Sports'],
                'Law': ['Academic', 'Social'],
                'Education': ['Social', 'Academic'],
                'Other': ['Social', 'Cultural']
            }
            
            # Track memberships for reporting
            total_memberships = 0
            
            for student in students:
                # Determine number of societies to join (power law distribution)
                # Most students join 1-3 societies, a few join many
                num_societies = min(
                    int(np.random.power(0.7) * 10) + 1,
                    societies.count()
                )
                
                # Get primary interests based on major
                primary_interests = major_affinities.get(student.major, ['Social'])
                
                # Weighted society selection
                society_weights = {}
                
                for society in societies:
                    # Base weight
                    weight = 1.0
                    
                    # Boost weight for societies matching major interests
                    if society.category in primary_interests:
                        weight *= 3.0
                    
                    # Boost weight for related categories
                    related_categories = category_affinities.get(society.category, [])
                    if any(cat in primary_interests for cat in related_categories):
                        weight *= 1.5
                    
                    society_weights[society.id] = weight
                
                # Select societies based on weights
                weighted_ids = []
                weighted_probabilities = []
                
                for society_id, weight in society_weights.items():
                    weighted_ids.append(society_id)
                    weighted_probabilities.append(weight)
                
                # Normalize probabilities
                sum_weights = sum(weighted_probabilities)
                normalized_probs = [w/sum_weights for w in weighted_probabilities]
                
                # Sample societies without replacement
                selected_indices = np.random.choice(
                    len(weighted_ids),
                    size=min(num_societies, len(weighted_ids)),
                    replace=False,
                    p=normalized_probs
                )
                
                selected_society_ids = [weighted_ids[i] for i in selected_indices]
                
                # Add memberships
                student.societies.add(*selected_society_ids)
                total_memberships += len(selected_society_ids)
            
            self.stdout.write(f"Generated {total_memberships} realistic memberships between students and societies.")