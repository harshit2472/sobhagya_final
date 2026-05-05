'use client';

import { useState, useEffect } from 'react';
import { Calendar, Star, Heart, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Head from 'next/head';
import Lottie from 'lottie-react';

export default function ZodiacSignPage() {
  const params = useParams();
  const signName = params?.sign as string;
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [lottieData, setLottieData] = useState(null);

  // Load Lottie animation data
  useEffect(() => {
    const loadLottieData = async () => {
      try {
        const response = await fetch(`/${signName}.json`);
        if (response.ok) {
          const data = await response.json();
          setLottieData(data);
        }
      } catch (error) {
        console.error('Error loading Lottie animation:', error);
      }
    };

    if (signName) {
      loadLottieData();
    }
  }, [signName]);

  // Complete zodiac data with astronomical-based content
  const zodiacData = {
    aries: {
      displayName: 'Aries',
      tagline: 'Bold, Passionate & Fearless',
      dates: 'March 21 - April 19',
      symbol: '♈',
      dailyInsight: {
        title: "Today's Insight",
        content: "Aries, the first sign of the zodiac, embodies the pioneering spirit of leadership and courage. Ruled by Mars, the planet of action and energy, you are naturally bold, ambitious, and always ready to take initiative. Your fiery nature drives you to be competitive, passionate, and fearless in pursuing your goals. As a cardinal fire sign, you possess an innate ability to start new ventures and inspire others with your enthusiasm. Your direct approach and unwavering determination make you a natural-born leader, though your impulsive nature sometimes requires patience and strategic thinking.",
        tags: [
          "Today's Vibe: Energetic & Driven",
          "Lucky Color: Red",
          "Lucky Number: 9"
        ]
      },
      loveRelationships: {
        daily: {
          title: "Love & Relationships",
          content: "Romance ignites with passionate intensity today, bringing exciting developments for both singles and committed partners. Your magnetic charm attracts potential romantic interests during afternoon social activities. For those in relationships, honest communication about future dreams strengthens your bond. Express your feelings boldly but remember to listen to your partner's desires. Evening hours favor intimate conversations and planning romantic adventures together.",
          tags: [
            "Best Matches:- Leo, Sagittarius",
            "Challenging Matches:- Cancer, Capricorn"
          ]
        },
        weekly: {
          title: "Love & Relationships",
          content: "This week brings deeper emotional connections and relationship growth. Your direct communication style will resolve any lingering misunderstandings. Plan spontaneous adventures with your partner or explore new social circles if single. Trust your instincts in matters of the heart - they're particularly sharp this week. Focus on balancing your independence with partnership needs.",
          tags: [
            "Communication: Direct & Honest",
            "Adventure: Spontaneous Plans",
            "Growth: Emotional Depth"
          ]
        },
        monthly: {
          title: "Love & Relationships",
          content: "This month marks a significant period for relationship development. Your passionate nature will be particularly attractive to potential partners. Long-term commitments may be on the horizon for those ready to take the next step. Focus on building trust through consistent actions and open communication. Your leadership qualities in love will shine brightly.",
          tags: [
            "Commitment: Long-term Focus",
            "Attraction: Natural Magnetism",
            "Trust: Building Foundations"
          ]
        },
        yearly: {
          title: "Love & Relationships",
          content: "This year brings transformative changes to your love life. Your pioneering spirit will lead you to new relationship territories. Focus on partnerships that support your ambitious nature and share your zest for life. This is a year for bold moves in love - don't hold back on expressing your true feelings and desires.",
          tags: [
            "Transformation: Bold Changes",
            "Partnership: Shared Ambitions",
            "Expression: True Feelings"
          ]
        }
      },
      personalLife: {
        daily: {
          title: "Personal Life",
          content: "Today brings powerful opportunities for personal transformation and self-discovery. Your inner fire burns brightly, urging you to break free from old patterns that no longer serve your growth. Trust your instincts when making important decisions, as your intuition is particularly sharp. Focus on developing patience with yourself and others, as this will enhance your natural leadership abilities and create deeper connections.",
          tags: [
            "Strengths: Courageous, Confident, Honest.",
            "Element: Fire",
            "Weaknesses: Impulsive, Short-tempered.",
            "Ruling Planet: Mars"
          ]
        },
        weekly: {
          title: "Personal Life",
          content: "This week emphasizes personal growth and self-improvement. Your natural leadership abilities will be recognized by colleagues and friends. Take time to reflect on your long-term goals and make necessary adjustments. Your innovative ideas will gain traction in professional settings. Focus on balancing your competitive nature with collaborative efforts.",
          tags: [
            "Leadership: Natural Recognition",
            "Innovation: Creative Solutions",
            "Balance: Competition & Collaboration"
          ]
        },
        monthly: {
          title: "Personal Life",
          content: "This month brings opportunities for career advancement and personal recognition. Your bold approach to challenges will pay off in unexpected ways. Focus on long-term planning while maintaining your spontaneous nature. New responsibilities may arise that showcase your leadership potential. Your energy and enthusiasm will be your greatest assets.",
          tags: [
            "Career: Advancement Opportunities",
            "Planning: Long-term Vision",
            "Energy: Enthusiastic Drive"
          ]
        },
        yearly: {
          title: "Personal Life",
          content: "This year is about establishing yourself as a leader in your chosen field. Your pioneering spirit will open new doors and create opportunities for growth. Focus on building lasting foundations for future success. Your natural ability to inspire others will be particularly valuable. This is a year for taking calculated risks and embracing new challenges.",
          tags: [
            "Leadership: Field Establishment",
            "Pioneering: New Opportunities",
            "Inspiration: Motivating Others"
          ]
        }
      }
    },
    taurus: {
      displayName: 'Taurus',
      tagline: 'Patient, Reliable & Determined',
      dates: 'April 20 - May 20',
      symbol: '♉',
      dailyInsight: {
        title: "Today's Insight",
        content: "Taurus, your earthy nature and Venusian influence bring stability and sensuality to your day. As a fixed earth sign, you possess remarkable patience and determination that helps you achieve your goals through steady effort. Your ruling planet Venus enhances your appreciation for beauty, comfort, and harmonious relationships. Today, your practical approach and strong work ethic will be recognized by others. Your natural ability to create security and build lasting foundations makes you a reliable partner in both personal and professional matters.",
        tags: [
          "Today's Vibe: Grounded & Persistent",
          "Lucky Color: Green",
          "Lucky Number: 6"
        ]
      },
      loveRelationships: {
        daily: {
          title: "Love & Relationships",
          content: "Your Venusian charm is particularly strong today, making you irresistible to potential partners. Your loyalty and commitment shine through in all relationships, creating deep emotional bonds. For singles, your natural beauty and magnetic personality attract admirers. In committed relationships, your partner appreciates your steadfast devotion and sensual nature. Focus on creating romantic experiences that engage all your senses.",
          tags: [
            "Best Matches:- Virgo, Capricorn",
            "Challenging Matches:- Leo, Aquarius"
          ]
        },
        weekly: {
          title: "Love & Relationships",
          content: "This week brings stability and deeper emotional connections. Your patient nature will help resolve any relationship tensions. Focus on building trust through consistent actions and honest communication. Your sensual nature will be particularly appealing to potential partners. Plan romantic activities that involve comfort and beauty.",
          tags: [
            "Stability: Emotional Foundation",
            "Trust: Consistent Actions",
            "Sensuality: Natural Appeal"
          ]
        },
        monthly: {
          title: "Love & Relationships",
          content: "This month emphasizes long-term relationship goals and commitment. Your reliable nature will be highly valued by partners. Focus on creating lasting memories and building a secure future together. Your practical approach to love will strengthen existing bonds and attract serious suitors.",
          tags: [
            "Commitment: Long-term Focus",
            "Reliability: Valued Trait",
            "Security: Future Building"
          ]
        },
        yearly: {
          title: "Love & Relationships",
          content: "This year brings opportunities for lasting love and partnership. Your patient approach will lead to meaningful connections. Focus on relationships that provide both emotional and material security. This is a year for building foundations that will last a lifetime.",
          tags: [
            "Lasting Love: Meaningful Connections",
            "Security: Emotional & Material",
            "Foundations: Lifetime Building"
          ]
        }
      },
      personalLife: {
        daily: {
          title: "Personal Life",
          content: "Your practical wisdom and financial acumen are highlighted today. Your ability to create security and build wealth through patient investment serves you well. Trust your instincts about people and situations, as your bull-like intuition rarely leads you astray. Your love for nature and the outdoors provides perfect balance to your material pursuits.",
          tags: [
            "Strengths: Patient, Reliable, Practical.",
            "Element: Earth",
            "Weaknesses: Stubborn, Possessive.",
            "Ruling Planet: Venus"
          ]
        },
        weekly: {
          title: "Personal Life",
          content: "This week focuses on building security and stability in all areas of life. Your practical approach will help you make sound financial decisions. Take time to enjoy the finer things in life and appreciate beauty around you. Your determination will help you overcome any obstacles.",
          tags: [
            "Security: Building Stability",
            "Finance: Sound Decisions",
            "Beauty: Appreciating Life"
          ]
        },
        monthly: {
          title: "Personal Life",
          content: "This month brings opportunities for material growth and personal satisfaction. Your patient approach to goals will yield significant results. Focus on building lasting wealth and creating a comfortable lifestyle. Your natural leadership in practical matters will be recognized.",
          tags: [
            "Growth: Material Success",
            "Patience: Rewarding Results",
            "Leadership: Practical Matters"
          ]
        },
        yearly: {
          title: "Personal Life",
          content: "This year is about establishing lasting foundations for future prosperity. Your methodical approach will create long-term security. Focus on building wealth through patient investment and wise decisions. Your natural ability to create comfort and beauty will enhance your quality of life.",
          tags: [
            "Foundations: Lasting Prosperity",
            "Method: Long-term Security",
            "Comfort: Quality of Life"
          ]
        }
      }
    },
    gemini: {
      displayName: 'Gemini',
      tagline: 'Versatile, Expressive & Quick-witted',
      dates: 'May 21 - June 20',
      symbol: '♊',
      dailyInsight: {
        title: "Today's Insight",
        content: "Gemini, your Mercury-ruled mind is exceptionally sharp today, making this an excellent time for communication and learning. As a mutable air sign, your adaptability and quick thinking help you navigate any situation with ease. Your natural curiosity drives you to explore new ideas and connect with diverse people. Your dual nature allows you to see multiple perspectives, making you an excellent mediator and communicator. Channel your mental energy into productive pursuits.",
        tags: [
          "Today's Vibe: Intellectual & Social",
          "Lucky Color: Yellow",
          "Lucky Number: 5"
        ]
      },
      loveRelationships: {
        daily: {
          title: "Love & Relationships",
          content: "Your communication skills are your greatest asset in relationships today. Your ability to express feelings clearly and listen actively creates deeper connections. For singles, your wit and charm make you highly attractive. In relationships, your partner values your intellectual stimulation and social energy. Avoid overthinking and trust your heart's guidance.",
          tags: [
            "Best Matches:- Libra, Aquarius",
            "Challenging Matches:- Virgo, Pisces"
          ]
        },
        weekly: {
          title: "Love & Relationships",
          content: "This week brings exciting social opportunities and relationship growth. Your communication skills will help resolve any misunderstandings. Your intellectual stimulation and social energy will attract new connections. Focus on balancing your need for variety with deeper emotional connections.",
          tags: [
            "Communication: Clear & Direct",
            "Social: New Connections",
            "Balance: Variety & Depth"
          ]
        },
        monthly: {
          title: "Love & Relationships",
          content: "This month emphasizes intellectual compatibility and communication in relationships. Your versatility and adaptability will be particularly attractive to potential partners. Focus on building connections that stimulate your mind and challenge your thinking. Your social nature will lead to meaningful encounters.",
          tags: [
            "Intellectual: Mind Stimulation",
            "Versatility: Natural Attraction",
            "Social: Meaningful Encounters"
          ]
        },
        yearly: {
          title: "Love & Relationships",
          content: "This year brings opportunities for intellectual partnerships and social growth. Your communication skills will be your greatest asset in building lasting relationships. Focus on connections that appreciate your versatility and mental agility. This is a year for expanding your social circle and finding like-minded partners.",
          tags: [
            "Partnerships: Intellectual Growth",
            "Communication: Lasting Asset",
            "Social: Expanding Circle"
          ]
        }
      },
      personalLife: {
        daily: {
          title: "Personal Life",
          content: "Your versatility opens doors to new opportunities today. Your ability to multitask and adapt to changing circumstances serves you well. Focus on developing consistency in your pursuits while maintaining your natural curiosity. Your social connections provide valuable support and inspiration.",
          tags: [
            "Strengths: Adaptable, Communicative, Witty.",
            "Element: Air",
            "Weaknesses: Indecisive, Restless.",
            "Ruling Planet: Mercury"
          ]
        },
        weekly: {
          title: "Personal Life",
          content: "This week focuses on mental stimulation and learning opportunities. Your curiosity will lead you to new knowledge and experiences. Take advantage of your natural communication skills to build valuable connections. Focus on balancing your many interests with consistent progress.",
          tags: [
            "Learning: New Knowledge",
            "Communication: Building Connections",
            "Balance: Interests & Progress"
          ]
        },
        monthly: {
          title: "Personal Life",
          content: "This month brings opportunities for intellectual growth and skill development. Your adaptability will help you excel in new areas. Focus on developing consistency in your pursuits while maintaining your natural curiosity. Your social connections will provide valuable opportunities.",
          tags: [
            "Growth: Intellectual Development",
            "Adaptability: New Areas",
            "Consistency: Pursuing Goals"
          ]
        },
        yearly: {
          title: "Personal Life",
          content: "This year is about expanding your knowledge base and communication skills. Your versatility will open doors to new career opportunities. Focus on building lasting foundations while maintaining your natural curiosity. Your social connections will be key to your success.",
          tags: [
            "Knowledge: Expanding Base",
            "Career: New Opportunities",
            "Foundations: Lasting Success"
          ]
        }
      }
    },
    cancer: {
      displayName: 'Cancer',
      tagline: 'Nurturing, Intuitive & Protective',
      dates: 'June 21 - July 22',
      symbol: '♋',
      dailyInsight: {
        title: "Today's Insight",
        content: "Cancer, your lunar influence is particularly strong today, enhancing your emotional intelligence and intuitive abilities. As a cardinal water sign, you possess natural leadership qualities combined with deep emotional sensitivity. Your ruling planet Moon governs your moods and instincts, making you highly attuned to others' feelings. Your nurturing nature and protective instincts create a safe haven for loved ones. Trust your gut feelings and emotional wisdom.",
        tags: [
          "Today's Vibe: Emotional & Nurturing",
          "Lucky Color: Silver",
          "Lucky Number: 2"
        ]
      },
      loveRelationships: {
        title: "Love & Relationships",
        content: "Your emotional depth creates profound connections in relationships today. Your intuitive understanding of your partner's needs strengthens your bond. For singles, your caring nature and emotional availability attract serious suitors. In relationships, your loyalty and devotion create lasting love. Express your feelings openly and create emotional intimacy.",
        tags: [
          "Best Matches:- Scorpio, Pisces",
          "Challenging Matches:- Aries, Libra"
        ]
      },
      personalLife: {
        title: "Personal Life",
        content: "Your home and family are your greatest sources of joy today. Your ability to create emotional security and maintain traditions provides stability. Your intuitive business sense and financial acumen help you build wealth. Focus on balancing your caring nature with self-care.",
        tags: [
          "Strengths: Intuitive, Nurturing, Loyal.",
          "Element: Water",
          "Weaknesses: Moody, Overly Sensitive.",
          "Ruling Planet: Moon"
        ]
      }
    },
    leo: {
      displayName: 'Leo',
      tagline: 'Confident, Creative & Generous',
      dates: 'July 23 - August 22',
      symbol: '♌',
      dailyInsight: {
        title: "Today's Insight",
        content: "Leo, your solar energy is at its peak today, making you the center of attention wherever you go. As a fixed fire sign, you possess natural leadership qualities and an innate sense of drama. Your ruling planet Sun bestows upon you charisma, creativity, and a generous spirit. Your natural confidence and warm personality draw people to you like moths to a flame. Your creative talents and passion for life inspire others to pursue their dreams.",
        tags: [
          "Today's Vibe: Charismatic & Creative",
          "Lucky Color: Gold",
          "Lucky Number: 1"
        ]
      },
      loveRelationships: {
        title: "Love & Relationships",
        content: "Your magnetic personality makes you irresistible in relationships today. Your generosity and loyalty create deep emotional bonds. For singles, your confidence and charm attract admirers. In relationships, your partner feels special and valued. Your natural romantic nature creates memorable experiences. Remember to balance giving with receiving.",
        tags: [
          "Best Matches:- Aries, Sagittarius",
          "Challenging Matches:- Taurus, Scorpio"
        ]
      },
      personalLife: {
        title: "Personal Life",
        content: "Your creative talents and leadership abilities shine today. Your natural optimism and enthusiasm inspire others to follow your lead. Your generosity and big heart create lasting friendships. Focus on developing patience and listening skills to enhance your leadership.",
        tags: [
          "Strengths: Confident, Creative, Generous.",
          "Element: Fire",
          "Weaknesses: Arrogant, Stubborn.",
          "Ruling Planet: Sun"
        ]
      }
    },
    virgo: {
      displayName: 'Virgo',
      tagline: 'Analytical, Practical & Diligent',
      dates: 'August 23 - September 22',
      symbol: '♍',
      dailyInsight: {
        title: "Today's Insight",
        content: "Virgo, your Mercury-ruled analytical mind is exceptionally sharp today, making this perfect for detailed work and problem-solving. As a mutable earth sign, you possess remarkable attention to detail and practical wisdom. Your ruling planet Mercury enhances your communication skills and intellectual abilities. Your natural perfectionism and desire for order help you create efficient systems and processes. Your helpful nature and reliability make you an invaluable team member.",
        tags: [
          "Today's Vibe: Analytical & Efficient",
          "Lucky Color: Brown",
          "Lucky Number: 5"
        ]
      },
      loveRelationships: {
        title: "Love & Relationships",
        content: "Your attention to detail and thoughtfulness enhance your relationships today. Your practical approach to love creates stable foundations. For singles, your intelligence and reliability attract serious partners. In relationships, your partner appreciates your caring gestures and practical support. Express your feelings through actions rather than words.",
        tags: [
          "Best Matches:- Taurus, Capricorn",
          "Challenging Matches:- Gemini, Sagittarius"
        ]
      },
      personalLife: {
        title: "Personal Life",
        content: "Your organizational skills and work ethic bring success today. Your ability to analyze situations and find practical solutions serves you well. Your natural healing abilities and desire to help others create meaningful connections. Focus on balancing perfectionism with self-acceptance.",
        tags: [
          "Strengths: Analytical, Practical, Reliable.",
          "Element: Earth",
          "Weaknesses: Overcritical, Perfectionist.",
          "Ruling Planet: Mercury"
        ]
      }
    },
    libra: {
      displayName: 'Libra',
      tagline: 'Diplomatic, Gracious & Fair-minded',
      dates: 'September 23 - October 22',
      symbol: '♎',
      dailyInsight: {
        title: "Today's Insight",
        content: "Libra, your Venusian charm and sense of balance are particularly strong today. As a cardinal air sign, you possess natural leadership qualities combined with diplomatic skills. Your ruling planet Venus enhances your appreciation for beauty, harmony, and relationships. Your natural sense of justice and fairness makes you an excellent mediator and peacemaker. Your ability to see all sides of an issue helps you make balanced decisions.",
        tags: [
          "Today's Vibe: Balanced & Diplomatic",
          "Lucky Color: Pink",
          "Lucky Number: 6"
        ]
      },
      loveRelationships: {
        title: "Love & Relationships",
        content: "Your natural charm and romantic nature enhance relationships today. Your ability to create harmony and balance strengthens your connections. For singles, your beauty and grace attract admirers. In relationships, your partner values your fairness and romantic gestures. Focus on maintaining your independence while nurturing your partnership.",
        tags: [
          "Best Matches:- Gemini, Aquarius",
          "Challenging Matches:- Cancer, Capricorn"
        ]
      },
      personalLife: {
        title: "Personal Life",
        content: "Your diplomatic skills and sense of justice serve you well today. Your ability to create harmony in all areas of life brings success. Your natural artistic talents and appreciation for beauty enhance your surroundings. Focus on making decisions confidently without overthinking.",
        tags: [
          "Strengths: Diplomatic, Gracious, Fair.",
          "Element: Air",
          "Weaknesses: Indecisive, People-pleaser.",
          "Ruling Planet: Venus"
        ]
      }
    },
    scorpio: {
      displayName: 'Scorpio',
      tagline: 'Passionate, Mysterious & Determined',
      dates: 'October 23 - November 21',
      symbol: '♏',
      dailyInsight: {
        title: "Today's Insight",
        content: "Scorpio, your Pluto-ruled intensity and penetrating insight are at their peak today. As a fixed water sign, you possess remarkable emotional depth and psychological understanding. Your ruling planet Pluto governs transformation and regeneration, making you naturally drawn to uncovering hidden truths. Your magnetic personality and mysterious aura draw people to you. Your determination and passion help you achieve any goal you set your mind to.",
        tags: [
          "Today's Vibe: Intense & Transformative",
          "Lucky Color: Deep Red",
          "Lucky Number: 8"
        ]
      },
      loveRelationships: {
        title: "Love & Relationships",
        content: "Your emotional intensity creates profound connections in relationships today. Your loyalty and passion create unbreakable bonds. For singles, your mysterious aura and magnetic personality attract admirers. In relationships, your partner feels deeply loved and protected. Express your feelings with vulnerability to deepen intimacy.",
        tags: [
          "Best Matches:- Cancer, Pisces",
          "Challenging Matches:- Leo, Aquarius"
        ]
      },
      personalLife: {
        title: "Personal Life",
        content: "Your psychological insight and investigative abilities serve you well today. Your natural healing powers and ability to transform situations create positive change. Your strong will and determination help you overcome any obstacle. Focus on using your power for positive purposes.",
        tags: [
          "Strengths: Passionate, Mysterious, Determined.",
          "Element: Water",
          "Weaknesses: Jealous, Secretive.",
          "Ruling Planet: Pluto"
        ]
      }
    },
    sagittarius: {
      displayName: 'Sagittarius',
      tagline: 'Optimistic, Adventurous & Philosophical',
      dates: 'November 22 - December 21',
      symbol: '♐',
      dailyInsight: {
        title: "Today's Insight",
        content: "Sagittarius, your Jupiter-ruled optimism and thirst for knowledge are particularly strong today. As a mutable fire sign, you possess natural adaptability and an adventurous spirit. Your ruling planet Jupiter expands your horizons and brings good fortune. Your natural enthusiasm and positive outlook inspire others to pursue their dreams. Your philosophical nature and love for learning make you a natural teacher and guide.",
        tags: [
          "Today's Vibe: Optimistic & Adventurous",
          "Lucky Color: Purple",
          "Lucky Number: 3"
        ]
      },
      loveRelationships: {
        title: "Love & Relationships",
        content: "Your optimism and adventurous spirit enhance relationships today. Your honesty and directness create authentic connections. For singles, your enthusiasm and positive energy attract admirers. In relationships, your partner appreciates your honesty and sense of adventure. Plan exciting experiences together to strengthen your bond.",
        tags: [
          "Best Matches:- Aries, Leo",
          "Challenging Matches:- Virgo, Pisces"
        ]
      },
      personalLife: {
        title: "Personal Life",
        content: "Your natural leadership and teaching abilities shine today. Your optimism and faith in the future help you overcome challenges. Your love for travel and new experiences broadens your perspective. Focus on developing patience and attention to detail.",
        tags: [
          "Strengths: Optimistic, Adventurous, Honest.",
          "Element: Fire",
          "Weaknesses: Impatient, Blunt.",
          "Ruling Planet: Jupiter"
        ]
      }
    },
    capricorn: {
      displayName: 'Capricorn',
      tagline: 'Ambitious, Disciplined & Responsible',
      dates: 'December 22 - January 19',
      symbol: '♑',
      dailyInsight: {
        title: "Today's Insight",
        content: "Capricorn, your Saturn-ruled discipline and ambition are particularly strong today. As a cardinal earth sign, you possess natural leadership qualities combined with practical wisdom. Your ruling planet Saturn governs responsibility and structure, making you naturally organized and goal-oriented. Your patience and determination help you achieve long-term success. Your practical approach and strong work ethic make you a reliable leader and partner.",
        tags: [
          "Today's Vibe: Ambitious & Disciplined",
          "Lucky Color: Black",
          "Lucky Number: 4"
        ]
      },
      loveRelationships: {
        title: "Love & Relationships",
        content: "Your loyalty and commitment create stable relationships today. Your practical approach to love builds lasting foundations. For singles, your reliability and ambition attract serious partners. In relationships, your partner values your stability and dedication. Express your feelings through consistent actions and support.",
        tags: [
          "Best Matches:- Taurus, Virgo",
          "Challenging Matches:- Cancer, Libra"
        ]
      },
      personalLife: {
        title: "Personal Life",
        content: "Your organizational skills and financial acumen bring success today. Your ability to plan for the future and work steadily toward goals serves you well. Your natural leadership abilities and sense of responsibility create trust. Focus on balancing work with personal relationships.",
        tags: [
          "Strengths: Ambitious, Disciplined, Responsible.",
          "Element: Earth",
          "Weaknesses: Pessimistic, Rigid.",
          "Ruling Planet: Saturn"
        ]
      }
    },
    aquarius: {
      displayName: 'Aquarius',
      tagline: 'Innovative, Independent & Humanitarian',
      dates: 'January 20 - February 18',
      symbol: '♒',
      dailyInsight: {
        title: "Today's Insight",
        content: "Aquarius, your Uranus-ruled innovation and humanitarian spirit are particularly strong today. As a fixed air sign, you possess natural determination and intellectual independence. Your ruling planet Uranus governs originality and sudden change, making you naturally progressive and forward-thinking. Your unique perspective and innovative ideas help you solve complex problems. Your humanitarian nature and desire for social justice inspire others to create positive change.",
        tags: [
          "Today's Vibe: Innovative & Independent",
          "Lucky Color: Electric Blue",
          "Lucky Number: 7"
        ]
      },
      loveRelationships: {
        title: "Love & Relationships",
        content: "Your intellectual connection and friendship foundation enhance relationships today. Your independence and unique perspective create interesting dynamics. For singles, your originality and humanitarian nature attract admirers. In relationships, your partner values your intellectual stimulation and respect for independence. Focus on emotional intimacy while maintaining your individuality.",
        tags: [
          "Best Matches:- Gemini, Libra",
          "Challenging Matches:- Taurus, Scorpio"
        ]
      },
      personalLife: {
        title: "Personal Life",
        content: "Your innovative thinking and problem-solving abilities shine today. Your humanitarian values and desire for social progress create meaningful impact. Your natural leadership in groups and organizations brings recognition. Focus on balancing your independence with emotional connection.",
        tags: [
          "Strengths: Innovative, Independent, Humanitarian.",
          "Element: Air",
          "Weaknesses: Detached, Unpredictable.",
          "Ruling Planet: Uranus"
        ]
      }
    },
    pisces: {
      displayName: 'Pisces',
      tagline: 'Compassionate, Intuitive & Artistic',
      dates: 'February 19 - March 20',
      symbol: '♓',
      dailyInsight: {
        title: "Today's Insight",
        content: "Pisces, your Neptune-ruled intuition and artistic sensitivity are particularly strong today. As a mutable water sign, you possess remarkable adaptability and emotional depth. Your ruling planet Neptune governs spirituality and imagination, making you naturally intuitive and creative. Your compassionate nature and ability to empathize with others create deep emotional connections. Your artistic talents and vivid imagination help you express complex emotions.",
        tags: [
          "Today's Vibe: Intuitive & Creative",
          "Lucky Color: Sea Green",
          "Lucky Number: 2"
        ]
      },
      loveRelationships: {
        title: "Love & Relationships",
        content: "Your emotional sensitivity and intuitive understanding enhance relationships today. Your romantic nature and desire for soul connection create profound bonds. For singles, your compassion and artistic nature attract admirers. In relationships, your partner feels deeply understood and loved. Trust your intuition about relationship matters.",
        tags: [
          "Best Matches:- Cancer, Scorpio",
          "Challenging Matches:- Gemini, Sagittarius"
        ]
      },
      personalLife: {
        title: "Personal Life",
        content: "Your artistic talents and creative abilities shine today. Your intuitive understanding of people and situations serves you well. Your spiritual nature and connection to the divine provide guidance. Focus on grounding your dreams in practical reality.",
        tags: [
          "Strengths: Compassionate, Intuitive, Artistic.",
          "Element: Water",
          "Weaknesses: Escapist, Overly Idealistic.",
          "Ruling Planet: Neptune"
        ]
      }
    }
  };

  const currentSign = zodiacData[signName as keyof typeof zodiacData];

  if (!currentSign) {
    return (
      <div className="min-h-screen bg-[#FCF4E9] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Zodiac Sign Not Found</h1>
          <Link href="/services/horoscope" className="text-orange-600 hover:text-orange-700">
            Back to Horoscope
          </Link>
        </div>
      </div>
    );
  }

  // Dynamic horoscope data based on planetary influences
  const horoscopeData = {
    daily: {
      title: "Today's Insight",
      content: currentSign.dailyInsight.content,
      tags: currentSign.dailyInsight.tags,
      icon: Calendar,
      color: "from-orange-500 to-red-500"
    },
    weekly: {
      title: "Tomorrow's Guidance",
      content: `This week brings ${currentSign.displayName} opportunities for growth and transformation. Your ruling planet influences your path, bringing positive energy to your endeavors. Focus on key aspects of your life while maintaining balance with your natural nature.`,
      tags: [
        `Weekly Vibe: Positive`,
        `Focus Area: Growth`,
        `Best Day: ${getBestDay(currentSign.displayName)}`
      ],
      icon: Calendar,
      color: "from-blue-500 to-purple-500"
    },
    monthly: {
      title: "Weekly Horoscope",
      content: `This month marks a period of positive growth for ${currentSign.displayName}. Your key focus will bring unexpected breakthroughs. The planetary alignments favor your natural qualities. Trust your intuition guidance for important decisions.`,
      tags: [
        `Monthly Theme: Positive & Growth`,
        `Key Focus: Development`,
        `Lucky Month: ${getLuckyMonth(currentSign.displayName)}`
      ],
      icon: Calendar,
      color: "from-green-500 to-teal-500"
    },
    yearly: {
      title: "Yearly Horoscope",
      content: `This year represents a major turning point for ${currentSign.displayName}, bringing positive opportunities. Your key abilities will be recognized on a larger scale. Focus on building strong foundations using your natural nature. Your intuition influence will guide you toward success.`,
      tags: [
        `Yearly Theme: Major Life Changes`,
        `Career Focus: Growth & Innovation`,
        `Personal Growth: Positive Development`
      ],
      icon: Calendar,
      color: "from-purple-500 to-pink-500"
    }
  };

  // Helper functions for dynamic content
  function getBestDay(sign: string): string {
    const dayMap: { [key: string]: string } = {
      'Aries': 'Tuesday', 'Taurus': 'Friday', 'Gemini': 'Wednesday',
      'Cancer': 'Monday', 'Leo': 'Sunday', 'Virgo': 'Wednesday',
      'Libra': 'Friday', 'Scorpio': 'Tuesday', 'Sagittarius': 'Thursday',
      'Capricorn': 'Saturday', 'Aquarius': 'Saturday', 'Pisces': 'Thursday'
    };
    return dayMap[sign] || 'Wednesday';
  }

  function getLuckyMonth(sign: string): string {
    const monthMap: { [key: string]: string } = {
      'Aries': 'March', 'Taurus': 'April', 'Gemini': 'May',
      'Cancer': 'June', 'Leo': 'July', 'Virgo': 'August',
      'Libra': 'September', 'Scorpio': 'October', 'Sagittarius': 'November',
      'Capricorn': 'December', 'Aquarius': 'January', 'Pisces': 'February'
    };
    return monthMap[sign] || 'March';
  }

  const currentHoroscope = horoscopeData[selectedPeriod];

  return (
    <>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet" />
      </Head>
      <div className="min-h-screen bg-white">
      {/* Sun Sign Banner */}
      <div className="bg-[#FCF4E9] text-[#745802] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            {/* Zodiac Symbol on Left */}
            <div className="w-32 h-32 flex items-center justify-center">
              {lottieData ? (
                <Lottie 
                  animationData={lottieData} 
                  loop={true}
                  autoplay={true}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <div className="text-8xl text-[#745802]">
                  {currentSign.symbol}
                </div>
              )}
            </div>
            
            {/* Text Content on Right */}
            <div className="text-left">
              <h1 className="text-4xl sm:text-5xl font-bold mb-2 text-[#745802]" style={{ fontFamily: 'EB Garamond, serif' }}>{currentSign.displayName}</h1>
              <p className="text-xl sm:text-2xl text-[#745802] italic mb-2">{currentSign.tagline}</p>
              <p className="text-lg text-[#745802]">Date Range: {currentSign.dates}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Left Section - Time Period Selector (30%) */}
            <div className="lg:w-1/3">
              <div className="bg-gray-100 rounded shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-black mb-6">Horoscopes</h3>
                <nav className="space-y-1">
                  {[
                    { id: 'daily', label: "Today's Insight", period: 'daily' },
                    { id: 'weekly', label: "Tomorrow's Guidance", period: 'weekly' },
                    { id: 'monthly', label: "Weekly Horoscope", period: 'monthly' },
                    { id: 'yearly', label: "Yearly Horoscope", period: 'yearly' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedPeriod(item.period as any)}
                      className={`w-full text-left px-3 py-3 text-base transition-all duration-200 border-b border-gray-300 last:border-b-0 ${
                        selectedPeriod === item.period
                          ? 'text-black font-bold'
                          : 'text-black font-normal hover:text-gray-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Right Section - Horoscope Details (70%) */}
            <div className="lg:w-2/3">
              
              {/* Current Period Horoscope */}
              <div className="bg-white rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold text-[#745802] mb-4">{currentHoroscope.title}</h2>
                <p className="text-black leading-relaxed mb-6 text-lg text-justify">
                  {currentHoroscope.content}
                </p>
                <div className="flex flex-wrap gap-3">
                  {currentHoroscope.tags.map((tag, index) => (
                    <span key={index} className="px-4 py-2 bg-[#FCF4E9] text-[#745802] rounded-lg text-sm font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Love & Relationships Section */}
              <div className="bg-white rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold text-[#745802] mb-4">
                  {(currentSign.loveRelationships as any)[selectedPeriod]?.title || (currentSign.loveRelationships as any).title || "Love & Relationships"}
                </h2>
                <p className="text-black leading-relaxed mb-6 text-lg text-justify">
                  {(currentSign.loveRelationships as any)[selectedPeriod]?.content || (currentSign.loveRelationships as any).content || "Your relationships are influenced by your zodiac sign's natural characteristics."}
                </p>
                <div className="flex flex-wrap gap-3">
                  {((currentSign.loveRelationships as any)[selectedPeriod]?.tags || (currentSign.loveRelationships as any).tags || []).map((tag: string, index: number) => (
                    <span key={index} className="px-4 py-2 bg-[#FCF4E9] text-[#745802] rounded-lg text-sm font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Personal Life Section */}
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-2xl font-bold text-[#745802] mb-4">
                  {(currentSign.personalLife as any)[selectedPeriod]?.title || (currentSign.personalLife as any).title || "Personal Life"}
                </h2>
                <p className="text-black leading-relaxed mb-6 text-lg text-justify">
                  {(currentSign.personalLife as any)[selectedPeriod]?.content || (currentSign.personalLife as any).content || "Your personal life is guided by your zodiac sign's unique characteristics and planetary influences."}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {((currentSign.personalLife as any)[selectedPeriod]?.tags || (currentSign.personalLife as any).tags || []).map((tag: string, index: number) => (
                    <span key={index} className="px-4 py-2 bg-[#FCF4E9] text-[#745802] rounded-lg text-sm font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
