from random import choice, sample

class RandomSocietyDataGenerator():
    """Class encompassing tools to generate society data"""
    def __init__(self):
        self.prefix_names = [
            "Mathematics",
            "Football",
            "Literature",
            "Physics",
            "Chemistry",
            "Biology",
            "Computing",
            "Gaming",
            "Rugby",
            "Tennis",
            "Badminton",
            "Sewing",
            "Knitting",
            "Swimming",
            "Sailing",
            "Economics",
            "Politics",
            "Retro",
            "Architecture",
            "Art",
            "Tabletop",
            "Chess",
            "Fashion",
            "Music",
            "Philosophy",
        ]
        self.suffix_names = [
            "Club",
            "Society",
            "Group",
            "Association",
            "Union",
        ]

        self.generated_names = []

        self.opening_phrases = [
            "A vibrant community dedicated to",
            "An engaging environment focused on",
            "A dynamic group passionate about",
            "A friendly place for",
            "An inclusive community aimed at",
        ]

        self.middle_phrases = [
            "bringing like-minded individuals together.",
            "promoting learning and collaboration.",
            "fostering creativity and innovation.",
            "connecting enthusiasts from all backgrounds.",
            "providing opportunities for skill development.",
        ]

        self.ending_phrases = [
            "Join us for events, discussions, and activities.",
            "Whether you're a beginner or an expert, there's something for everyone.",
            "Be part of our exciting journey and make new friends along the way.",
            "Together, we grow, learn, and make a difference.",
            "Your passion and enthusiasm are always welcome here.",
        ]

        self.final_paragraphs = [
            "Our members are at the heart of everything we do, and we take "
            "pride in building a welcoming and supportive atmosphere. "
            "We encourage creativity, friendship, and lifelong connections."
            " Come along and see what we're all about!",

            "We believe that every individual brings something unique to the "
            "group, and we strive to create an environment where everyone feels"
            " valued and heard. Don't miss out on the chance to be part of a "
            "thriving community that makes a difference!",

            "By joining us, you'll be opening the door to new experiences, "
            "friendships, and learning opportunities. We're always looking for"
            " fresh ideas and passionate members to help us grow. Come be part "
            "of our story!",

            "No matter your background or experience level, you'll find a place with us. "
            "Bring your ideas, your enthusiasm, and your curiosity—we can't wait to meet you!",
        ]

        self.categories = [
            "Academic & Educational",
            "Arts & Culture",
            "Sports & Fitness",
            "Technology & Computing",
            "Gaming & Esports",
            "Social & Community",
            "Creative & Performing Arts",
            "Hobbies & Interests",
            "Political & Activism",
            "Science & Innovation",
            "Environment & Sustainability",
            "Outdoor & Adventure",
            "Faith & Spirituality",
            "Cultural & Diversity",
            "Media & Journalism",
            "Volunteering & Charity",
            "Food & Culinary",
            "Business & Entrepreneurship",
            "Fashion & Design",
            "Mind & Wellbeing",
            "Historical & Heritage",
            "Language & Literature",
            "Philosophy & Debate",
            "STEM & Innovation",
            "Personal Development",
        ]

        self.tags = {
            "community": [],
            "education": [],
            "culture": [],
            "sports": [
                "Football",
                "Rugby",
                "Tennis",
                "Badminton",
                "Swimming",
                "Sailing"
            ],
            "technology": ["Gaming"],
            "gaming": ["Gaming", "Tabletop"],
            "arts": ["Fashion", "Art", "Music", "Literature"],
            "creative": ["Fashion", "Art", "Music", "Literature", "Sewing", "Knitting"],
            "innovation": [],
            "learning": [],
            "discussion": ["Philosophy", "Politics"],
            "networking": [],
            "environment": [],
            "adventure": [],
            "spirituality": [],
            "diversity": [],
            "media": [],
            "volunteering": [],
            "culinary": [],
            "business": ["Economics"],
            "fashion": ["Fashion"],
            "wellbeing": [],
            "history": [],
            "language": [],
            "philosophy": ["Philosophy", "Politics"],
            "stem": [
                "Mathematics",
                "Physics",
                "Chemistry",
                "Biology",
                "Computing"
            ],
            "development": ["Economics"],
            "friendship": [],
            "collaboration": [],
        }

    def generate(self) -> dict:
        """Generates artificial data for a society and returns in a dict"""
        return_dict = {}

        return_dict["name"] = self.generate_name()
        return_dict["description"] = self.generate_description()
        return_dict["category"] = choice(self.categories)
        return_dict["tags"] = self.generate_tags(return_dict["name"].split()[0])

        return return_dict

    def generate_name(self) -> str:
        """Generates a society name"""
        prename = choice(self.prefix_names)
        sufname = choice(self.suffix_names)

        if len(self.generated_names) < len(self.suffix_names) * len(self.prefix_names) - 1:
            while hash(prename + sufname) in self.generated_names:
                prename = choice(self.prefix_names)
                sufname = choice(self.suffix_names)

        self.generated_names.append(hash(prename + sufname))
        return f"{prename} {sufname}"

    def generate_description(self) -> str:
        """Generates a society description"""
        a = choice(self.opening_phrases)
        b = choice(self.middle_phrases)
        c = choice(self.ending_phrases)
        d = choice(self.final_paragraphs)

        return f"{a} {b}\n{c}\n\n{d}"

    def generate_tags(self, prename) -> list:
        """Generates tags for a society"""
        r_tags = []
        for tag, tag_list in self.tags.items():
            if prename in tag_list:
                r_tags.append(tag)
            if len(r_tags) >= 3:
                break

        if len(r_tags) < 3:
            remaining_tags = list(set(self.tags.keys()) - set(r_tags))
            r_tags.extend(sample(remaining_tags, k=3-len(r_tags)))
        return r_tags
