# Welcome to Manuscript
You can write notes using Markdown.    
Manuscript also supports embedded files (Images, Code & Videos) and code with syntax highlighting.   

[comment]: <> (This is the editing view)
[comment]: <> (You can change anything in here and exit with ESC)
[comment]: <> (Or create a new note)

## What is markdown?

Markdown is a "programming language" for writing text files with styling.    
Here is a small listing of the basic markdown syntax:

``` 
__bold text goes here__
_italic text goes here_
# First heading
## Second heading
###### 6th heading

` ` `
Code Block
(Remove spaces between backticks)
` ` `

`Inline code`

[Link name](URL for the link)

A table:

| Hello | World |
|-------|-------|
| Good morning | Sun|
| C you | Moon |
| Moin | Pluto |

Or a comment:
[comment]: <> (Your comment goes here)

Yes, markdown does have comments. They won't be rendered and are greate for small information
```

### Manuscript Markdown

Manuscript added the flowing syntax:

```
Linked notes: [[Name of another note]]
Embedded file: [[@Name of a file]]
```

A linked note shows a link in your text that leads to file.    
An embedded file can be an image, code file or video.    
Examples for embedded files:   
```
[[@hello.png]]: Embedds a file called hello.png if it is in the manuscript folder.   
```

The "manuscript folder" is ~/manuscript.

## Writing the first note
First, you have to create a new note by clicking the + icons in the file list.

Then, you see a new note with the current date as name and headline.    
You can change the name of the note in the text input on the top of the screen.    

After that, you have to click the notes content to enter editing mode.   
You can do this with this note too. Just click somewhere in this text.    

Now, you can write or change the content of your note.    
To get back to preview mode, press Escape or click somewhere outside the editing area.

The note gets rendered. This means file get embedded, syntax highlighting applied,...    
If the note is very long, it may take 2-3 seconds.    

The file gets saved right after entering preview mode or changing the name.

## Deleting a note
Next to every note name in the note list is a trash can.    
After clicking it you have to confirm that you want to delete it and then it gets removed.

## Settings
In the upper right corner is a settings icon, that, when clicked opens the settings.<br>
You can there change some theming settings and the font. Also some features can be disabled there, too.