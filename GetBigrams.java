import java.util.Scanner;
import java.util.Hashtable;
import java.util.Enumeration;
import java.util.Arrays;

import java.io.PrintStream;
import java.io.IOException;
import java.io.File;

public class GetBigrams {
  public static void main(String[] args) throws IOException{
    File[] covers = new File("covers").listFiles();
    File[] originals = new File("original").listFiles();
    
    Hashtable<String, NGram> coverGrams = new Hashtable<String, NGram>();
    Hashtable<String, NGram> originalGrams = new Hashtable<String, NGram>();
    
    for(File f : covers) {
      Scanner cover = new Scanner(f);
      while(cover.hasNextLine()) {
        String[] tokens = cover.nextLine().trim().split(" ");
        if(tokens.length > 0) {
          add("^ " + tokens[0], coverGrams);
          for(int i = 0; i < tokens.length - 1; i++) {
            add(tokens[i] + " " + tokens[i + 1], coverGrams);
          }
          add(tokens[tokens.length - 1] + " $", coverGrams);
        }
      }
      cover.close();
    }
    for(File f : originals) {
      Scanner original = new Scanner(f);
      while(original.hasNextLine()) {
        String[] tokens = original.nextLine().trim().split(" ");
        if(tokens.length > 0) {
          add("^ " + tokens[0], originalGrams);
          for(int i = 0; i < tokens.length - 1; i++) {
            add(tokens[i] + " " + tokens[i + 1], originalGrams);
          }
          add(tokens[tokens.length - 1] + " $", originalGrams);
        }
      }
      original.close();
    }
    
    NGram[] sortedCovers = coverGrams.values().toArray(new NGram[0]);
    Arrays.sort(sortedCovers);
    int sum = 0;
    for(NGram gram : sortedCovers) {
      sum += gram.count;
    }
    PrintStream out = new PrintStream(new File("ngrams/bi_covers.txt"));
    out.println(sum);
    for(NGram gram : sortedCovers) {
      out.println(gram);
    }
    out.close();
    
    NGram[] sortedOriginals = originalGrams.values().toArray(new NGram[0]);
    Arrays.sort(sortedOriginals);
    sum = 0;
    for(NGram gram : sortedOriginals) {
      sum += gram.count;
    }
    out = new PrintStream(new File("ngrams/bi_originals.txt"));
    out.println(sum);
    for(NGram gram : sortedOriginals) {
      out.println(gram);
    }
    out.close();
  }
  
  public static void add(String bigram, Hashtable<String, NGram> table) {
    NGram gram = table.get(bigram);
    if(gram == null) {
      table.put(bigram, new NGram(bigram));
    } else {
      gram.add1();
    }
  }
}