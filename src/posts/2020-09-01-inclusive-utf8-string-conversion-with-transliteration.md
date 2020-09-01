---
title:  "Inclusively converting UTF-8 strings to ASCII using ICU Transliterator"
abstract: "Legacy systems often mess up names like Bjørn or Renée, because of their “special characters”.
Using transliteration instead of character set conversion can fix this issue."
date: 2020-09-01
description: "Learn how to use ICU Transliterator to correctly transform UTF-8 strings."
---

With the general availability and widespread support of UTF-8, character encoding issues are slowly
becoming a problem of the past, thankfully. But unfortunately there's still tons of legacy systems
out there that don't support it.

I ran into this exact problem quite recently. I had built a "Book an appointment"-form for a client.
All user input, including the customer's name, needed to be sent to the client's legacy CRM via a
proprietary HTTP API.  
As it turned out, that system only accepts [ASCII](https://en.wikipedia.org/wiki/ASCII "ASCII") ☹️.
That's right: _Just_ ASCII, not even [Extended ASCII](https://en.wikipedia.org/wiki/Extended_ASCII
"Extended ASCII"). Any attempt to send a string with non-ASCII characters resulted in an HTTP
400-error.

## Inclusivity
What's in a name? Well, certainly not only ASCII characters!  
Some people are called Bjørn or François, for example. If Bjørn or François would try to use the
form, they couldn't book an appointment (assuming they'd enter their name including these non-ASCII
characters).

Apart from lost sales by my client, that is not _inclusive_ at all.
[Web inclusivity](https://www.w3.org/WAI/fundamentals/accessibility-usability-inclusion/) means that
anyone, regardless of age and gender but also language or location, should be able to use the web.
So naturally, declining Bjørn and François to use our form just because their names have some "weird
letters", is not acceptable by any means.

I consulted with the client but sadly the problem couldn't (or wouldn't) be fixed on their end, and
they asked if I could provide a solution. So I needed to come up with a way to transform or convert
the user's input into ASCII.

First, let's define what the actual desired result is. I'll be using this fictitious name: `Daniël
Renée François Bjørn in’t Veld`. Every word in this string has a non-ASCII character. If we need to
convert this to ASCII, we should find characters that look similar. In other words, I want the end
result to be: `Daniel Renee Francois Bjorn in't Veld`. In my opinion that is as close as we can get.

You may argue that even converting `François` to `Francois` and `Bjørn` to `Bjorn` isn't inclusive.
They're different letters with different pronunciations. And I agree! That's why I'd like to
emphasize that you should only do this as a last resort only. **If you have any viable ways to
refrain from having to convert user input (e.g. someone's name), you absolutely should!**

But given the choice between a) not being able to use a form at all or b) being called Bjorn, I'm
sure that Bjørn would choose the latter.


Enough talk, let's code! Converting a UTF-8 string to ASCII 😎. Can't be hard, right?

<aside><p>Note: I'll be using PHP, but most examples are applicable to other languages as well.</p></aside>

## The obvious choice: iconv
If you search for _php utf8 to ascii_ `iconv` is the first function that pops up:
> iconv — Convert string to requested character encoding  
> Performs a character set conversion on the string `str` from `in_charset` to `out_charset`.

As the [documentation](https://www.php.net/manual/en/function.iconv.php) states, there are three
"modes" in which iconv can operate: _plain_, _IGNORE_ and _TRANSLIT_. Let's not waste any time and
put it to the test:

```php
<?php
$name = 'Daniël Renée François Bjørn in’t Veld';

$plain    = iconv("UTF-8", "ASCII", $name);
$ignore   = iconv("UTF-8", "ASCII//IGNORE", $name);
$translit = iconv("UTF-8", "ASCII//TRANSLIT", $name);

var_dump($plain, $ignore, $translit);
```
[Run this example on 3v4l.org »](https://3v4l.org/RREJl) {.c-code-example-link}

Output:
```md
Notice: iconv(): Detected an illegal character in input string in /in/RREJl on line 4
bool(false)
string(32) "Danil Rene Franois Bjrn int Veld"
string(37) "Dani?l Ren?e Fran?ois Bj?rn in't Veld"
```

Well, that's disappointing:

* The _plain_ mode triggered an `E_NOTICE` and returned `false`: it means that iconv detected one or
  more characters that it couldn't fit into the output charset and just gave up;
* The _IGNORE_ mode simply discarded the characters it couldn't fit into ASCII;
* The _TRANSLIT_ mode tried to replace the "special" characters with similarly looking ASCII
  characters, but failed. Except for `’` — the
  [Right Single Quotation Mark](https://www.compart.com/en/unicode/U+2019), which is not uncommon in
  Dutch surnames — they're all replaced by a question mark.

The PHP docs warn that this may happen: _"TRANSLIT conversion is likely to fail for characters which
are illegal for the out_charset."_ And if you read the comments in the documentation you'll find
that iconv's _TRANSLIT_ mode behaves very inconsistently between different systems. In other words:
you can't rely on iconv's _TRANSLIT_ mode at all. Makes you wonder why they provide it in the first
place 🤔.

Now technically I could've used the _IGNORE_ mode of iconv and be done with it. It doesn't contain
any non-ASCII characters anymore – so my API call wouldn't fail anymore. But it's not the result
that I set out for, and it wouldn't be inclusive at all. Again: if my name is François, I want to be
called François, _maybe_ Francois but not Franois and most certainly not Fran?ois.


## Transliteration
Although iconv's _TRANSLIT_ mode doesn't seem usable, I feel we are on the right track with
_transliteration_. So what exactly is transliteration?

Transliteration in the general sense of the word, is "conversion of a text from one script to
another that involves swapping letters in predictable ways"
([Wikipedia](https://en.wikipedia.org/wiki/Transliteration)). It is, for example, the conversion of
`Стравинский` (Cyrillic script) to `Stravinsky` (Latin script).



## Alternative ways





## Removing diacritics


> This is a blokcuote How can we make sure that even with a severely limited character set like
> ASCII we still allow for user input to be used in the most inclusive way possible?  
> _test name_


f�r▯

- banking exports
- sv
