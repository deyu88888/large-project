from unittest import mock
import types
from django.test import TestCase
from django.core.management import call_command

from api.management.commands.advanced_evaluation import Command


class AdvancedEvaluationCommandTest(TestCase):

    def setUp(self):
        self.command = Command()
        self.command.stdout = mock.MagicMock()
        self.command.stderr = mock.MagicMock()
        self.command.style = mock.MagicMock()
        self.command.style.SUCCESS = lambda x: x
        self.command.style.ERROR = lambda x: x
        self.command.style.WARNING = lambda x: x

    def test_save_evaluation_results(self):
        with mock.patch('api.management.commands.advanced_evaluation.os.makedirs') as mock_makedirs, \
             mock.patch('api.management.commands.advanced_evaluation.open', mock.mock_open()) as mock_open, \
             mock.patch('api.management.commands.advanced_evaluation.datetime') as mock_datetime, \
             mock.patch('api.management.commands.advanced_evaluation.json.dump') as mock_json_dump:

            mock_datetime.now.return_value.strftime.return_value = '20250101_120000'

            results = {'test': 'data'}
            self.command._save_evaluation_results(results)

            mock_makedirs.assert_called_once()
            mock_open.assert_called_once()
            mock_json_dump.assert_called_once()

    def test_create_baseline_recommender(self):
        recommender = self.command._create_baseline_recommender()
        self.assertTrue(hasattr(recommender, 'get_recommendations_for_student'))

    def test_print_evaluation_summary(self):
        results = {
            'num_students': 4,
            'k': 5,
            'n_folds': 2,
            'models': {
                'advanced': {
                    'aggregate': {
                        'precision': {'mean': 0.75, 'std': 0.15, 'min': 0.6, 'max': 0.9},
                        'recall': {'mean': 0.8, 'std': 0.2, 'min': 0.6, 'max': 1.0}
                    }
                },
                'baseline': {
                    'aggregate': {
                        'precision': {'mean': 0.5, 'std': 0.1, 'min': 0.4, 'max': 0.6},
                        'recall': {'mean': 0.6, 'std': 0.15, 'min': 0.45, 'max': 0.75}
                    }
                }
            }
        }

        self.command._print_evaluation_summary(results)

        self.command.stdout.write.assert_called()

    def test_handle_not_enough_students(self):
        with mock.patch('api.management.commands.advanced_evaluation.Student.objects.filter') as mock_filter, \
             mock.patch('api.management.commands.advanced_evaluation.Student.objects.annotate') as mock_annotate:

            mock_filter.return_value.annotate.return_value.filter.return_value.values_list.return_value = []
            mock_annotate.return_value.filter.return_value.values_list.return_value = []

            options = {'k': 5, 'folds': 5, 'test_only': False}
            self.command.handle(**options)

            self.command.stdout.write.assert_any_call(
                self.command.style.ERROR("Not enough eligible students for 5-fold cross-validation. Found 0 students.")
            )
            self.command.stdout.write.assert_any_call(
                self.command.style.ERROR("Cannot run evaluation with fewer than 2 eligible students.")
            )

    @mock.patch('api.management.commands.advanced_evaluation.Command._evaluate_with_holdout')
    def test_handle_full_workflow(self, mock_evaluate):
        mock_evaluate.return_value = {
            'num_students': 2,
            'metrics': {
                'precision': {'mean': 0.5, 'std': 0.1, 'min': 0.4, 'max': 0.6, 'count': 2},
                'recall': {'mean': 1.0, 'std': 0.0, 'min': 1.0, 'max': 1.0, 'count': 2}
            },
            'per_student': {1: {'hit': 1}, 2: {'hit': 0}}
        }

        with mock.patch('api.management.commands.advanced_evaluation.Student.objects.annotate') as mock_annotate, \
             mock.patch('api.management.commands.advanced_evaluation.KFold') as mock_kfold, \
             mock.patch('api.management.commands.advanced_evaluation.random.shuffle'), \
             mock.patch.object(Command, '_save_evaluation_results') as mock_save, \
             mock.patch.object(Command, '_print_evaluation_summary') as mock_print:

            mock_annotate.return_value.filter.return_value.values_list.return_value = [1, 2, 3, 4, 5]

            mock_kfold.return_value.split.return_value = [
                ([0, 1, 2], [3, 4]),
                ([0, 3, 4], [1, 2])
            ]

            options = {'k': 5, 'folds': 2, 'test_only': False}
            self.command.handle(**options)

            self.assertEqual(mock_evaluate.call_count, 4)
            mock_save.assert_called_once()
            mock_print.assert_called_once()

    def test_custom_evaluate_with_holdout(self):
        original_method = Command._evaluate_with_holdout

        def simple_evaluate(self, recommender, student_ids, k):
            if len(student_ids) == 0:
                return {
                    'num_students': 0,
                    'metrics': {
                        'precision': {'mean': 0, 'std': 0, 'min': 0, 'max': 0, 'count': 0},
                        'recall': {'mean': 0, 'std': 0, 'min': 0, 'max': 0, 'count': 0},
                        'hit_rate': {'mean': 0, 'std': 0, 'min': 0, 'max': 0, 'count': 0},
                        'diversity': {'mean': 0, 'std': 0, 'min': 0, 'max': 0, 'count': 0},
                        'novelty': {'mean': 0, 'std': 0, 'min': 0, 'max': 0, 'count': 0}
                    },
                    'per_student': {}
                }

            results = {
                'num_students': len(student_ids),
                'metrics': {
                    'precision': {'mean': 0.5, 'std': 0, 'min': 0.5, 'max': 0.5, 'count': 1},
                    'recall': {'mean': 1.0, 'std': 0, 'min': 1.0, 'max': 1.0, 'count': 1},
                    'hit_rate': {'mean': 1.0, 'std': 0, 'min': 1.0, 'max': 1.0, 'count': 1},
                    'diversity': {'mean': 1.0, 'std': 0, 'min': 1.0, 'max': 1.0, 'count': 1},
                    'novelty': {'mean': 0.7, 'std': 0, 'min': 0.7, 'max': 0.7, 'count': 1}
                },
                'per_student': {
                    student_ids[0]: {
                        'holdout_id': 1,
                        'recommendations': [1, 3],
                        'hit': 1,
                        'precision': 0.5,
                        'diversity': 1.0,
                        'novelty': 0.7
                    }
                }
            }

            return results

        try:
            Command._evaluate_with_holdout = types.MethodType(simple_evaluate, Command)
            mock_recommender = mock.MagicMock()
            results = self.command._evaluate_with_holdout(mock_recommender, [1], 5)
            self.assertEqual(results['num_students'], 1)
            self.assertEqual(results['metrics']['precision']['mean'], 0.5)
            self.assertEqual(results['metrics']['recall']['mean'], 1.0)
            self.assertIn(1, results['per_student'])
            self.assertEqual(results['per_student'][1]['precision'], 0.5)

        finally:
            Command._evaluate_with_holdout = original_method