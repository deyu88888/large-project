# TODO: initial refactoring complete

from random import choice


class RandomCommentDataGenerator():
    """Class encompassing tools to generate event data"""
    def __init__(self):
        self.comment_content = [
            "The venue looks very high-quality.",
            "Can't wait for the insightful discussions here!",
            "Marking my calendar in anticipation!",
            "Does anyone know if there will be any Q&A sessions?",
            "Be there or be square.",
        ]

        self.past_comment_content = [
            "Incredibly well organized!",
            "Great job on the engaging event",
            "Everything ran so smoothly",
            "Had lots of fun, would love to attend again!",
            "Wasn't my favourite but I still had fun",
        ]

        self.replies = [
            "Very true!",
            "I'm not sure I totally agree.",
            "Interesting to hear your perspective",
            "Can't wait to see you there!",
        ]

    def generate_comment(self, past=False) -> dict:
        """Generates artificial data for a event and returns in a dict"""
        return_dict = {}

        comment_pool = self.comment_content
        if past:
            comment_pool.extend(self.past_comment_content)
        return_dict["content"] = choice(comment_pool)

        return return_dict

    def generate_reply(self) -> dict:
        """Generate a reply to a comment"""
        return_dict = {}

        comment_pool = self.replies
        return_dict["content"] = choice(comment_pool)

        return return_dict