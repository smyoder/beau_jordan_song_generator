public class NGram implements Comparable<NGram> {
  public String ngram;
  public int count;
  
  public NGram(String ngram) {
    this.ngram = ngram;
    this.count = 1;
  }
  
  public void add1() {
    count++;
  }
  
  @Override
  public String toString() {
    return ngram + " " + count;
  }
  
  @Override
  public int compareTo(NGram other) {
    return other.count - count;
  }
  
  @Override
  public boolean equals(Object o) {
    if(o instanceof NGram) {
      NGram other = (NGram) o;
      return ngram.equals(other.ngram);
    }
    return false;
  }
}
