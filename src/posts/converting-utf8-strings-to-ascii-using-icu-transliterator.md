---
title:  "Converting UTF-8 strings to ASCII using the ICU Transliterator"
abstract: "Sometimes we still have to work with legacy systems with limited character sets like ASCII.<br>
I learned the ICU Transliterator is a valuable tool for converting strings between character sets, with even more extensive transforms possible."
date: 2020-10-17
description: "Learn how to use ICU Transliterator to correctly convert UTF-8 strings."
---

With the general availability and widespread support of UTF-8, character encoding issues are thankfully becoming a problem of the past. But unfortunately there are still tons of legacy systems out there that don't support it.

I ran into this exact problem quite recently. I had built a "Book an appointment" form for a client. All user input, including the customer's name, is sent to the client's legacy CRM via a proprietary HTTP API.  It turned out that said CRM only accepts [ASCII](https://en.wikipedia.org/wiki/ASCII "ASCII") ☹️. That's right: _Just_ ASCII, not even [Extended ASCII](https://en.wikipedia.org/wiki/Extended_ASCII
"Extended ASCII"). Any attempt to send a string with non-ASCII characters resulted in an HTTP 400-error. That meant that people with names like Bjørn or François couldn't use that form — because those names contain non-ASCII characters.  Naturally, it is not acceptable by any means to exclude Bjørn and François from using our form just because their names contain letters that don't appear on a [1960s teletypewriter](https://en.wikipedia.org/wiki/Teletype_Model_33).

I consulted with the client but sadly the problem couldn't (or wouldn't) be fixed on their end, and they asked if I could provide a solution. So I needed to come up with a way to transform or convert the user's input into ASCII.

## The desired result

First, let's define what the actual desired result is. I'll be using this fictitious name:  `Daniël Renée François Bjørn in’t Veld`.  Every word in this string has a non-ASCII character. If we need to convert this string to ASCII, we should find characters that look similar. To be precise, I want the end result to be: `Daniel Renee Francois Bjorn in't Veld`.  In my opinion that is as close as we can get.

**At this point I want to stress that if you have a viable way to refrain from having to convert user input (e.g., someone's name), you absolutely should!**
In other words: if someone is called Bjørn, please go out of your way to make sure your systems call them Bjørn. Someone's name is part of their identity and not something you want to mess up. I for one already get annoyed when a system autocapitalises my surname into "Van Raaij". Imagine my frustration if I were to be called "B@rt" just because a system doesn't have the `a` character in their character set. 

That being said: given the choice between a) not being able to use a form or service at all or b) being called Bjorn, I'm sure that Bjørn would choose the latter.

Enough talk, let's code! Converting a UTF-8 string to ASCII can't be hard, right?

_Note: I'll be using PHP, but the examples are applicable to other languages as well._

## The obvious choice: iconv

If you search for _php utf8 to ascii_ [`iconv`](https://www.php.net/manual/en/function.iconv.php) is the first function that pops up:
> iconv — Convert string to requested character encoding  
> 
> `iconv ( string $in_charset , string $out_charset , string $str ) : string`
> 
> Performs a character set conversion on the string `str` from `in_charset` to `out_charset`.{.c-php-doc}

As the [documentation](https://www.php.net/manual/en/function.iconv.php) states, there are three 'modes' in which iconv can operate: _plain_, _IGNORE_ and _TRANSLIT_. Let's not waste any time and put it to the test:

```php
<?php
$name = 'Daniël Renée François Bjørn in’t Veld';

$plain    = iconv("UTF-8", "ASCII", $name);
$ignore   = iconv("UTF-8", "ASCII//IGNORE", $name);
$translit = iconv("UTF-8", "ASCII//TRANSLIT", $name);

var_dump($plain, $ignore, $translit);
```
[Run this code example on 3v4l.org »](https://3v4l.org/RREJl) {.c-code-example-link}

Output:
```md
Notice: iconv(): Detected an illegal character in input string in /in/RREJl on line 4
bool(false)
string(32) "Danil Rene Franois Bjrn int Veld"
string(37) "Dani?l Ren?e Fran?ois Bj?rn in't Veld"
```

Well, that's disappointing:

* The _plain_ mode triggered an `E_NOTICE` and returned `false`. It means that iconv detected one or  more characters that it couldn't fit into the output charset, and it just gave up;
* The _IGNORE_ mode simply discarded the characters it couldn't fit into ASCII;
* The _TRANSLIT_ mode tried to replace the non-ASCII characters with similarly looking ASCII characters, but failed. Except for `’` — the
  [Right Single Quotation Mark](https://www.compart.com/en/unicode/U+2019), which is not uncommon in
  Dutch surnames — they're all replaced by a question mark.

The PHP docs warn that this may happen: _"TRANSLIT conversion is likely to fail for characters which are illegal for the out_charset."_ And if you read the comments in the documentation you'll find that iconv's _TRANSLIT_ mode behaves very inconsistently between different systems. So apparently we can't rely on iconv's _TRANSLIT_ mode at all.

Technically I could've used the _IGNORE_ mode of iconv and be done with it. It doesn't contain any non-ASCII characters anymore so my API call wouldn't fail anymore. But it's not the result I set out for. Again: if my name is Bjørn, I want to be called Bjørn, I can live with "Bjorn" but not "Bjrn" and certainly not "Bj?rn".


## Transliteration
Although iconv's _TRANSLIT_ mode doesn't seem usable, I feel we are on the right track with _transliteration_. So what exactly is transliteration?

Transliteration, in the general sense of the word, is "conversion of a text from one script to another that involves swapping letters in predictable ways" ([Wikipedia](https://en.wikipedia.org/wiki/Transliteration)). It is, for example, the conversion of `Игорь Стравинский` (Cyrillic script) to `Igor Stravinsky` (Latin script). 

Now think of a character set as a script, and immediately it makes sense to use transliteration to convert text from one character set to another. The character `ø` is in the UTF-8 'script' but not in ASCII. Transliterating UTF-8 to ASCII would mean to find an ASCII-character that represents that character as good as possible.

Is it possible to perform these kinds of transliteration programmatically? Yes, it is!

## International Components for Unicode (ICU)

Enter _ICU_. The [_International Components for Unicode_](https://unicode-org.github.io/icu/userguide/icufaq/#what-is-icu) constitute a "cross-platform Unicode based globalisation library" with components for "locale-sensitive string comparison, date/time/number/currency/message formatting, text boundary detection, character set conversion and so on". It's built and provided by the [Unicode Consortium](https://github.com/unicode-org) as C/C++ and Java libraries, but wrappers exist for [plenty of other languages](http://site.icu-project.org/related), including PHP. In PHP it's better known as the [Internationalization extension](https://www.php.net/manual/en/intro.intl.php), or `ext-intl`.

Speaking of which, this sentence on the ICU Related Projects page made me smile: 
>"The upcoming PHP 6 language is expected to support Unicode through ICU4C". 

As you may know PHP 6 [never saw the light of day](https://ma.ttias.be/php6-missing-version-number/) but it *did* [lay the groundwork for the intl extension](https://www.phproundtable.com/episode/what-happened-to-php-6).

I could probably write a blog post for each and every component in the ICU library (I find internationalisation mighty interesting), but let's focus and see if the ICU Transliterator can help us in our quest to correctly converting UTF8 to ASCII.

## Using the ICU Transliterator

Let's dive right in. The PHP function we're looking for is [`transliterator_transliterate`](https://www.php.net/manual/en/transliterator.transliterate.php):

> transliterator_transliterate — Transliterate a string
>
> `transliterator_transliterate ( mixed $transliterator , string $subject [, int $start [, int $end ]] )`
>
> Transforms a string or part thereof using an ICU transliterator.{.c-php-doc}

_Note: I'm using the procedural function here for brevity, but PHP also provides a `Transliterator`  class._

The function call looks pretty straightforward at first, but the `$transliterator` parameter is where it gets a bit tricky. The docs are fairly brief and don't give much guidance, but fortunately the [ICU docs provide some insights](https://unicode-org.github.io/icu/userguide/transforms/general/#icu-transliterators):

> Latin-ASCII: Converts non-ASCII-range punctuation, symbols, and Latin letters in an approximate ASCII-range equivalent.

Jackpot? Let's try!

```php
<?php
$name = 'Daniël Renée François Bjørn in’t Veld';

$translitRules = 'Latin-ASCII';
$nameAscii = transliterator_transliterate($translitRules, $name);

var_dump($nameAscii);
```
[Run this code example on 3v4l.org »](https://3v4l.org/ck1jT) {.c-code-example-link}

Output:
```md
string(37) "Daniel Renee Francois Bjorn in't Veld"
```

That's it 👏 🥳! The ICU Transliterator produced our exact desired output! No warnings, errors or unexpected side effects. Mission accomplished! 

## Real transliteration

Or is it? Remember Igor Stravinsky? What if he was to use my form and entered his name in Cyrillic script instead of Latin? With our current implementation, this won't work, the output will simply be `Игорь Стравинский`. 
This is because we only told the transliterator to convert Latin characters to ASCII, so it will leave the Cyrillic characters unaffected. However, we can apply multiple transliteration rules, like so:

```php
<?php
$name = 'Игорь Стравинский';

$translitRules = 'Any-Latin; Latin-ASCII;';
$nameAscii = transliterator_transliterate($translitRules, $name);

var_dump($nameAscii);
```
[Run this code example on 3v4l.org »](https://3v4l.org/2AiNk) {.c-code-example-link}

Output:
```md
string(17) "Igor' Stravinskij"
```

By prepending the `Any-Latin` transform rule, the transliterator first converts text from any script into Latin script and then converts the Latin text into ASCII using `Latin-ASCII`. Both instructions are separated by a semicolon. That's it! That's our end mark.

With these few simple lines of PHP code, I have now found a simple yet reliable way to correctly transform any text into ASCII. Without hesitation I wrote a helper function using this code, made sure that all user input in my customer's form was passed through this function and end-to-end tested my form again. And as you might expect: the API call worked again and my customer was happy with my solution. All done!

_Note: The result of the `Any-Latin` transform may not exactly be what you would've expected, as that would've been `Igor Stravinsky`. This can be explained by the fact that transliteration between scripts isn't an exact science: "there are multiple incompatible standards and in reality transliteration is often carried out without any uniform standards" ([Wikipedia](https://en.wikipedia.org/wiki/Romanization_of_Russian#Systematic_transliterations_of_Cyrillic_to_Latin)). For example: on [the Italian Wikipedia page for Igor Stravinsky](https://it.wikipedia.org/wiki/Igor%27_F%C3%ABdorovi%C4%8D_Stravinskij) his name is written exactly like the output above whereas "Igor Stravinsky" is written on the English page._

## Bonus tip: a transliteration-powered slugify function

So far I have used two relatively simple transliterator instructions: `Any-Latin` and `Latin-ASCII`. The ICU Transliterator is far more powerful, however.

I'll leave you with a final bonus tip: here's a slugify function that uses the ICU Transliterator to create a slug (an SEO-friendly human-readable url part) from any arbitrary string:

```php
<?php
function slugify(string $input): string
{
    $translitRules = [
        ":: Any-Latin",
        ":: [:Nonspacing Mark:] Remove",
        ":: [:Punctuation:] Remove",
        ":: [:Symbol:] Remove",
        ":: Latin-ASCII",
        ":: Lower()",
        "' ' {' '} > ",
        "::NULL",
        "[:Separator:] > '-'",
    ];
    $transliterator =  \Transliterator::createFromRules(
        implode(';', $translitRules)
    );
    return $transliterator->transliterate($input);
}

$title = '<?php François😎: _+ / Стравинский`😜.';
$slug = slugify($title);
var_dump($slug);
```
[Run this code example on 3v4l.org »](https://3v4l.org/Hr0iJ) {.c-code-example-link}

Output:
```md
string(24) "php-francois-stravinskij"
```

I won't get into details as to how this works because this article is long enough as it is. At this point I encourage you to read more about the ICU Transliterator and experiment with it yourself!

## Conclusion
What can we conclude from this? I think the ICU Transliterator proves to be a valuable tool not only to convert text from one script to another but also to convert strings between character sets. Its output is more reliable than that of `iconv` and even far more extensive conversions are possible.

Do you have any questions, comments or tips following this article? Feel free to reach out to me [on Twitter](https://twitter.com/bartvanraaij)!

Thank you for reading my first-ever technical blog post. 😇

## Further reading and interesting links

- ["Proper Name Transliteration with ICU Transforms"](https://research.google/pubs/pub36450/) — A research study by Sascha Brawer Martin Jansche Hiroshi Takenaka Yui Terashima (Google), presented at the 34th Internationalization & Unicode Conference in 2010;
- ["Transliteration in ICU"](http://www.open-std.org/jtc1/sc22/wg20/docs/n915-transliteration-icu.pdf) — Slides and transcript of a presentation by Mark Davis and Alan Liu at the 19th International Unicode Conference in 2001;
- The official [ICU Documentation](https://unicode-org.github.io/icu/), [the old ICU documentation](http://userguide.icu-project.org/transforms/general) and [ICU on GitHub](https://github.com/unicode-org/icu);
- [PHP Transliterator](https://www.php.net/manual/en/class.transliterator.php) in the PHP documentation;
- ["Falsehoods Programmers Believe About Names"](https://www.kalzumeus.com/2010/06/17/falsehoods-programmers-believe-about-names/) — a must-read article by Patrick McKenzie;
- [Listen to The Final Hymn](https://open.spotify.com/track/3ZHZmrK9ZD9WAfBcgjz2Gs?si=v-POCuUCRxSEHo3cXUg8vA) of Igor Stravinsky's "The Firebird" suite on Spotify, performed by the Dutch Royal Concertgebouw Orchestra.


