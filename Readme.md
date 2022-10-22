## Features

  - Provide some powerUps making noting with the `template/slot system` in RemNote like using OOP languages like Java and C#  where these powerUps can work as some preserved words in these programme languages

###  The "Reference Tree" problem and why this plugin was created.
- There are occasions where "A reference to a rem containing references" appears, leading to a "reference chain" which can make up a "reference tree", sometimes it may be what you want, for the reference has a "good context" with abundant information.
  - ![](public/ReferenceTreeWithAbundantInfo.png)
  - ![](public/ReferenceTreeWithAbundantInfo1.png)
  - ![](public/ReferenceTreeWithAbundantInfo2.png)
  
  - The rem [[Rabies]] vaccine has a reference  to the rem Rabies
  - The rem  There are no contraindications to [[ [[Rabies]] Vaccination]], for any side effect is not comparable to death rabies can cause.    and  The price of the canine [[ [[Rabies]] Vaccination]] is one-tenth of vaccine for a human.   have references to the rem [[Rabies]] vaccine
    - I use Roam-like presentation for reference (`[[ ]]` nested in another `[[ ]]`)  here to have a better depict about the reference tree
  - the reference tree may look like this
```mermaid
graph TD;
  Rabies-->RabiesVaccine;
  RabiesVaccine-->Contraindications;
  RabiesVaccine-->PriceCompare;
```
    
-
- But for some occasions where a "reference chain" do not contain effective information, the "reference tree" would be a handicap when using backlinks and need to be "flatten". A classic example is `slot` system.
  - ![](public/ReferenceTreeWithLittleInfo2.png)
  - Here are brief about elemental sodium(Na) and potassium(K), and a sample of laboratory safety regulation.
  - Because safety is the most important thing for a lab, I want to make "matters needing attention when preserving flammable metal" a slot under the rem `Elemental Sodium` and `Elemental Potassium` so RemNote will remind me when I reference the rem `Elemental Sodium` elsewhere.

  - Reminding you to cope things according to the templates/slots and keeping you from forgetting some key steps or aspects are basic functions a template system can do.
  ![](public/SlotAutoRemind.png)
  - but I do not want to make rems with same content scattered in my knowledge base lest I cannot find all the backlinks in one place and I may forget to modify all the rems with duplicate content. 
  (Maybe you have heard the principle `DRY/Don't Repeat Yourself` in the field of programming. It is all the same. **I think taking note is like preparing program for your mind, and you can use the note like calling API functions someday. That's where the name of the plugin `ObjectOrientedNoting`  comes**)
  - So I have placed a reference to what the regulation said about flammable metal under the rem  `Elemental Sodium` and set the reference rem  `- [[must be preserved in kerosene and kept away from any heat source!]]`  itself a slot
    - ![](public/ReferenceTreeWithLittleInfo1.png)
  - But when applying the reference rem's slot, a "bad reference tree" needing to be flattened appears.
    - ![](public/ReferenceTreeWithLittleInfo4.png)
  - The "bad reference tree" needs to be flattened for form the backlink panel of the regulation clause (the true information source), you can find only one rem with reference to the clause, and another reference has referred to the reference rem itself.
    - ![](public/ReferenceTreeWithLittleInfo3.png)


###  `Pointer/*` in C++ to flatten the "bad reference tree"
- `Pointer` is aimed to reduce the height of "reference tree" and flatten the tree by reform the "reference chain" to "reference fork".
  - ![](public/UsePointer3.gif)
  - When the tag `##~pointer` added, the "reference tree" changed from a "chain" to a "fork" like this. As you can see, the height of the "reference tree" has been reduced, namely it has been flattened.
```mermaid
graph LR;
  
  %%notice["The label here is only <br/>used to indicate the parent-child<br/> relationship of the node"]

  subgraph idtwo[after POINTER work]
  id4["
  <ul>
        <li>flammable metal
            <ul>
                <li>
                    must be preserved in<br/> kerosene and kept away from<br/> any heat source!
                </li>
            </ul>
        </li>
  </ul>
  "]-->id5["<ul>
        <li>Elemental Sodium
            <ul>
                <li>
                    [[must be preserved <br/>in kerosene and kept away<br> from any heat source!]]
                </li>
            </ul>
        </li>
      </ul>"]
  id4-->id6[" 
      <ul>
        <li>must be isolated from open air
            <ul>
                <li>
                    [[must be preserved <br/>in kerosene and kept away<br> from any heat source!]]
                </li>
            </ul>
        </li>
      </ul>"]
  end
  subgraph idone[before POINTER work]
  id1["<ul>
        <li>flammable metal
            <ul>
                <li>
                    must be preserved in<br/> kerosene and kept away from<br/> any heat source!
                </li>
            </ul>
        </li>
  </ul>"]-->id2["<ul>
        <li>Elemental Sodium
            <ul>
                <li>
                    [[must be preserved <br/>in kerosene and kept away<br> from any heat source!]]
                </li>
            </ul>
        </li>
      </ul>"]
  id2-->id3["<ul>
        <li>must be isolated from open air
            <ul>
                <li>
                    [[ [[must be preserved in <br/> kerosene and kept away <br/> from any heat source!]] ]]

                </li>
            </ul>
        </li>
    </ul>    "]
  end
```
- Then you can see all the 2 rems referring to the clause's backlink panel.
  ![](public/TheEffectOfPointerRem.png)

- Let's regroup a little bit.
  1. I want to make the rem of a safety regulation clause a slot under rems about dangerous chemical `elemental sodium/potassium` elsewhere.
  2. To copy the plain text directly will violate the `DRY/Don't Repeat Yourself` principle.
  3. Use reference to the clause as a slot will lead to a "bad reference tree".
  4. That is why I need the `Pointer` rem, and I hope it can be helpful to you.


  
- Here is the explanation about `Pointer` in the last edition of `README.md`.
  - the Rem `[[Object1]]` ,which is tagged with `~Pointer`,  will guide other reference to itself (`[[ [[Object1]] ]]` ) to the rem it is  pointing to  ( turn `[[ [[Object1]] ]]` to `[[Object1]]`  )
  - This power up can converge reference to other templates' slot to the information source of the rem, assuring no redundant rems left.
  



![](public/UsePointerToClass2.gif)

### `Partial` in C# and Combination Problem
  - Backlinks enable us to "write everywhere and make up in one place" by just toggling rems from backlink portals to the document. 
  - `Partial` goes further, making "make up in one place" can be displaced from the workflow when it comes to the Template/Slot system.
  - A rem `RemA` tagged with `Partial` will find all the rem it referenced and added all the slots of `RemA` to them, attaching the slots `RemA` has to rems `RemA` has referenced.
    ![](public/PartialAttachSlots.gif)
    - Well, you can see the lab safety clause has referenced the rems `Elemental Sodium` and `Elemental Potassium`, when this clause tagged with `~Partial`, slots under the clause will be added under the two rems(`Elemental Sodium` and `Elemental Potassium`) and the two added slots' reference themselves will be set as a slot too.
    - The slots' reference will be `Pointer` rems implicitly.
      ![](public/ImplicitPointerOfPartial.gif)
    - Why the slots' reference becomes slots too? Because they are designed to be consequence of that the lab safety clause's slots have **"attached"** to the brief of the two kinds of flammable metal.
  - The powerUp `~Partial` comes down from the key word `partial` in C#, where this keyword is a modifier to class (whose name is `Form1` in the example), making the compiler combines the partial implements of `Form1` from different files to an integral class. *It can also be illustrated as that the "partial classes" have **"attached"** to the main part of the class `Form1`.*
```csharp
//other content of Form1 generated by Visual Studio is in other files. 
//application programmers can focus on their part of code.
//when being compiled all the "partial class" with the same name 
//will be converged to one integral class.
public partial class Form1 : Form
{
    public Form1()
     {
         InitializeComponent();
     }
}
 ```

When a Rem (like `New content added to     [[Class 1]]  and  [[Class 2]] ` below)  has been tagged with `~Partial`,  slots of **A**  ( like   `New content added to     [[Class 1]]  and  [[Class 2]]   > Method 3`  in the example below) will change any reference to the  Rem **A**'s slots reference (such as `[[Class2 > [[New content added to     [[Class 1]]  and  [[Class 2]]   > Method 3]] ]]`  ) to what the reference Rem **A** pointing to (like `[[  New content added to     [[Class 1]]  and  [[Class 2]]   > [[Method 3]]   ]] ` )

![](public/UsePointerToClass1.gif)

![](public/UsePointerToClass2.gif)




During RemNote's start or the rem tagged with ~partial (`New content added to     [[Class 1]]  and  [[Class 2]] `) being edited, it will add reference pointing to its slot to what the tagged rem has references to

![](public/AddPointerAutomatically.gif)



### `Instance(of)` in JS
- this powerUp is used to distinguish `class`&`object` or `definition`&`application`, which may be helpful when using RemNote as a math notebook to document the formula you learned and math exercise you did 
- For `instance`, 
  1. "Newton-Leibniz formula" is a `class` 
  2. A question like "a rabbit ran from (0,0) to (1,0) along the trace of *y=sin(πx)*. how long did it run? " is a `object`
  3. the question in 2 is an `instance(of)` the usage of 1.
  4. And the question in 2 can be tagged with this powerUp to note that it is an `exercise log`, not a `formula` needing memorize.
- **You can use this powerUp by just typing `##~Instance`** 
- At present (version 0.2.1) this powerUp does not have any special function. It only works as an identifier facilitate sorting in the backlink panel and a CSS tag to distinguish `class` and `Object`

## How to use
  
- You can use these powerUps just by using them as tags.
- You can use slash command `clear OON tags` to clear all OON tags attached to current focused rem.

