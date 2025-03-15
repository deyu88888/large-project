from random import choice

class RandomEventDataGenerator():
    """Class encompassing tools to generate event data"""
    def __init__(self):
        self.society_type = {
            "COMPETETIVE": [ # Tournament
                "football",
                "gaming",
                "rugby",
                "tennis",
                "badminton",
                "swimming",
                "sailing",
                "tabletop",
                "chess",
            ],
            "CASUAL": [ # Gathering
                "literature",
                "gaming",
                "sewing",
                "knitting",
                "retro",
                "art",
                "fashion",
                "music",
                "philosophy",
            ],
            "ACADEMIC": [ # Seminar
                "mathematics",
                "literature",
                "physics",
                "chemistry",
                "biology",
                "computing",
                "economics",
                "politics",
                "architecture",
                "robotics"
            ],
            "CREATIVE": [ # Showcase
                "sewing",
                "knitting",
                "architecture",
                "literature",
                "fashion",
                "robotics",
                "music",
                "retro",
            ],
            "TECHNICAL": [ # Workshop
                "computing",
                "physics",
                "mathematics",
                "architecture",
                "robotics",
                "economics",
            ],
            "DISCUSSION": [ # Debate
                "politics",
                "economics",
                "philosophy",
            ]
        }

        self.type_map = {
            "COMPETETIVE": "Tournament",
            "CASUAL": "Gathering",
            "ACADEMIC": "Seminar",
            "CREATIVE": "Showcase",
            "TECHNICAL": "Workshop",
            "DISCUSSION": "Debate",
        }

        self.opening_phrases = [
            "An exciting opportunity to experience",
            "A unique event centered around",
            "A vibrant gathering designed to celebrate",
            "A welcoming space for exploring",
            "An unforgettable event focused on",
        ]

        self.middle_phrases = [
            "connecting people with shared interests.",
            "celebrating creativity and collaboration.",
            "exploring new ideas and skills.",
            "bringing the community together for memorable experiences.",
            "fostering a sense of belonging and enthusiasm.",
        ]

        self.ending_phrases = [
            "Come join us for a day filled with excitement and inspiration.",
            "No matter your experience level, everyone is welcome to participate.",
            "Be part of something special and make lasting memories.",
            "Together, we'll create an event to remember.",
            "Don't miss out on this fantastic opportunity to get involved!",
        ]

        self.final_paragraphs = [
            "Our event brings together passionate individuals who share a love"
            " for new experiences and building connections. Whether you're a "
            "seasoned expert or just curious to learn more, there's something "
            "for everyone. Join us and be part of something special!",

            "We're committed to creating an event that leaves a lasting impression"
            "—one that inspires, connects, and empowers everyone involved. From"
            " thought-provoking discussions to hands-on activities, this is a "
            "chance to be part of a vibrant community!",

            "Don't just attend—be part of the story! Your participation makes all"
            " the difference, and we can't wait to see what ideas and enthusiasm "
            "you bring. Come along and make your mark on this exciting event!",

            "Everyone has something unique to contribute, and this event is "
            "designed to bring out the best in each of us. Whether you're here "
            "to learn, network, or simply have a good time, you're in the right place!",
        ]

    def generate(self, society_name) -> dict:
        """Generates artificial data for a event and returns in a dict"""
        return_dict = {}

        society_prename = society_name.split()[0]
        return_dict["name"] = self.generate_name(society_prename)
        return_dict["description"] = self.generate_description()

        return return_dict

    def generate_name(self, society_prename) -> str:
        """Generates an event name"""
        returnval = None
        options = list(self.society_type.keys())
        for _ in range (len(options)-1): # Purposeful to create variety
            # Designed to randomly accessing categories
            option = choice(options)
            options.remove(option)
            if society_prename.lower() in self.society_type[option]:
                returnval = f"{society_prename} {self.type_map[option]}"
                break

        if not returnval:
            returnval = f"{society_prename} {choice(['Event', 'Meet'])}"

        return returnval

    def generate_description(self):
        """Generates an event description"""
        a = choice(self.opening_phrases)
        b = choice(self.middle_phrases)
        c = choice(self.ending_phrases)
        d = choice(self.final_paragraphs)

        return f"{a} {b}\n{c}\n\n{d}"
